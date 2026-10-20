import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { catchError, concatMap, from, map, of } from 'rxjs';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { AplicacionListado } from '../../../features/aplicaciones/models/aplicacion-listado.model';
import { ESTADO_APLICACION, EstadoAplicacion } from '../../../features/aplicaciones/models/formulario-aplicacion.model';
import { AplicacionService } from '../../../features/aplicaciones/services/aplicacion.service';

/** Fila de la tabla: la aplicación con lo que se muestra y se busca ya resuelto. */
interface AplicacionFila extends AplicacionListado {
  nombreCompleto: string;
  anio: number;
  avance: number;
  etiquetaEstado: string;
  severidadEstado: 'secondary' | 'warn' | 'info' | 'success';
}

/** Resultado de "Calcular pendientes" para una aplicación. */
interface CalculoFila {
  fila: AplicacionFila;
  error: string | null;
}

const normalizar = (texto: string | null | undefined) =>
  (texto ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/**
 * Listado general de aplicaciones de los clientes asignados al psicólogo: filtros por empresa, año, estado y
 * texto; abre la digitación y calcula de una vez las pendientes (solo las completas: el backend lo exige).
 */
@Component({
  selector: 'app-aplicacion-list',
  standalone: true,
  imports: [DatePipe, FormsModule, ReactiveFormsModule, RouterLink, ButtonModule, CardModule, Dialog, IconFieldModule,
    InputIconModule, InputTextModule, ProgressBarModule, SelectModule, TableModule, TagModule],
  templateUrl: './aplicacion-list.component.html',
  styleUrl: './aplicacion-list.component.scss'
})
export class AplicacionListComponent implements OnInit {

  readonly estados = ESTADO_APLICACION;
  readonly ordenEstados: EstadoAplicacion[] = ['SIN_RESPUESTAS', 'INCOMPLETA', 'PENDIENTE_CALCULO', 'CALCULADA'];

  searchControl = new FormControl('', { nonNullable: true });
  filtroCliente: number | null = null;
  filtroAnio: number | null = null;
  filtroEstado: EstadoAplicacion | null = null;

  opcionesCliente: { label: string; value: number }[] = [];
  opcionesAnio: { label: string; value: number }[] = [];

  original: AplicacionFila[] = [];
  /** Por empresa y año (sin estado ni texto): base de las tarjetas. */
  private delPeriodo: AplicacionFila[] = [];
  lstAplicaciones: AplicacionFila[] = [];
  conteo: Record<EstadoAplicacion, number> = { SIN_RESPUESTAS: 0, INCOMPLETA: 0, PENDIENTE_CALCULO: 0, CALCULADA: 0 };
  cargando = false;

  displayCalculoDialog = false;
  calculando = false;
  porCalcular: AplicacionFila[] = [];
  calculadas: CalculoFila[] = [];

  constructor(
    private aplicacionService: AplicacionService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.searchControl.valueChanges.subscribe(() => this.filtrar());
    this.cargar(true);
  }

  /** @param inicial la primera vez el año arranca en el actual (o el más reciente con aplicaciones) */
  cargar(inicial = false): void {
    this.cargando = true;
    this.aplicacionService.listado().subscribe({
      next: aplicaciones => {
        this.cargando = false;
        this.original = aplicaciones.map(a => ({
          ...a,
          nombreCompleto: `${a.apellido.trim()} ${a.nombre.trim()}`,
          anio: Number(a.fechaAplicacion.substring(0, 4)),
          avance: a.aplicables ? Math.floor(a.respondidas * 100 / a.aplicables) : 0,
          etiquetaEstado: ESTADO_APLICACION[a.estado].etiqueta,
          severidadEstado: ESTADO_APLICACION[a.estado].severidad
        }));
        this.armarOpciones();
        if (inicial) {
          const actual = new Date().getFullYear();
          this.filtroAnio = this.opcionesAnio.some(o => o.value === actual) ? actual : this.opcionesAnio[0]?.value ?? null;
        }
        this.filtrar();
      },
      error: error => {
        this.cargando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  filtrar(): void {
    const termino = normalizar(this.searchControl.value.trim());
    this.delPeriodo = this.original.filter(a =>
      (!this.filtroCliente || a.idCliente === this.filtroCliente)
      && (!this.filtroAnio || a.anio === this.filtroAnio));
    this.ordenEstados.forEach(e => this.conteo[e] = this.delPeriodo.filter(a => a.estado === e).length);
    this.lstAplicaciones = this.delPeriodo.filter(a =>
      (!this.filtroEstado || a.estado === this.filtroEstado)
      && (!termino || [a.numeroIdentificacion, a.nombreCompleto, a.cliente, a.evaluador]
        .some(campo => normalizar(campo).includes(termino))));
  }

  /** Clic en una tarjeta: filtra por ese estado (o lo quita si ya estaba). */
  filtrarPorEstado(estado: EstadoAplicacion | null): void {
    this.filtroEstado = this.filtroEstado === estado ? null : estado;
    this.filtrar();
  }

  limpiar(): void {
    this.filtroCliente = null;
    this.filtroEstado = null;
    this.searchControl.setValue('');
  }

  /** Las pendientes de cálculo de la empresa y el año elegidos (no depende del texto ni del estado). */
  get pendientes(): AplicacionFila[] {
    return this.delPeriodo.filter(a => a.estado === 'PENDIENTE_CALCULO');
  }

  get empresaFiltro(): string {
    return this.opcionesCliente.find(o => o.value === this.filtroCliente)?.label ?? 'todas las empresas';
  }

  get errores(): CalculoFila[] {
    return this.calculadas.filter(c => c.error);
  }

  abrirCalculo(): void {
    this.porCalcular = this.pendientes;
    this.calculadas = [];
    this.displayCalculoDialog = true;
  }

  /** De a una, para no cargar el servidor; un error no detiene las demás. */
  calcularPendientes(): void {
    this.calculando = true;
    from(this.porCalcular).pipe(
      concatMap(fila => this.aplicacionService.calcular(fila.id).pipe(
        map((): CalculoFila => ({ fila, error: null })),
        catchError(error => of({ fila, error: error?.error?.message ?? 'No se pudo calcular' }))
      ))
    ).subscribe({
      next: resultado => this.calculadas.push(resultado),
      complete: () => {
        this.calculando = false;
        const bien = this.calculadas.length - this.errores.length;
        this.messageService.add({
          severity: this.errores.length ? 'warn' : 'success',
          summary: 'Calcular pendientes',
          detail: `${bien} calculada(s)` + (this.errores.length ? `, ${this.errores.length} con error` : '') + '.'
        });
        this.cargar();
      }
    });
  }

  get progreso(): number {
    return this.porCalcular.length ? Math.round(this.calculadas.length * 100 / this.porCalcular.length) : 0;
  }

  private armarOpciones(): void {
    const clientes = new Map(this.original.map(a => [a.idCliente, a.cliente]));
    this.opcionesCliente = [...clientes]
      .map(([value, label]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label));
    this.opcionesAnio = [...new Set(this.original.map(a => a.anio))]
      .sort((a, b) => b - a)
      .map(anio => ({ label: String(anio), value: anio }));
  }

}
