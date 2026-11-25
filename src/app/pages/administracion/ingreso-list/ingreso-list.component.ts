import { DatePipe } from '@angular/common';
import { Component, Signal, computed, effect } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { normalizar } from '../../../core/utils/texto.util';
import {
  Ingreso, RESULTADO_INGRESO, ResultadoIngreso, navegadorCorto
} from '../../../features/ingresos/models/ingreso.model';
import { IngresoService } from '../../../features/ingresos/services/ingreso.service';

/** Fila de la tabla: el intento con el navegador resumido y la etiqueta y el color del resultado. */
interface IngresoFila extends Ingreso {
  navegadorCorto: string;
  etiqueta: string;
  severidad: 'success' | 'warn' | 'danger';
}

/** Un correo con intentos fallidos o bloqueados en el rango (posible intento de adivinar la contraseña). */
interface CorreoSospechoso {
  correo: string;
  nombreUsuario: string | null;
  fallidos: number;
  bloqueados: number;
  ultimo: string;
}

/** Cuántos correos muestra el recuadro de intentos fallidos. */
const MAXIMO_SOSPECHOSOS = 5;
const DIAS_POR_DEFECTO = 30;

/**
 * Intentos de ingreso (solo ADMIN: la IP es un dato personal). Rango de días que se pide al backend (por defecto
 * los últimos 30); tarjetas por resultado, buscador y el recuadro de correos con más intentos fallidos se aplican
 * en el front sobre lo recibido. Sin exportar.
 */
@Component({
  selector: 'app-ingreso-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    DatePickerModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    MessageModule,
    TableModule,
    TagModule,
    TooltipModule
  ],
  templateUrl: './ingreso-list.component.html',
  styleUrl: './ingreso-list.component.scss'
})
export class IngresoListComponent {

  readonly resultados = RESULTADO_INGRESO;
  readonly ordenResultados: ResultadoIngreso[] = ['EXITOSO', 'FALLIDO', 'BLOQUEADO'];
  readonly hoy = new Date();

  rango: Date[];
  searchControl = new FormControl('', { nonNullable: true });
  filtroResultado: ResultadoIngreso | null = null;

  original: IngresoFila[] = [];
  lstIngresos: IngresoFila[] = [];
  sospechosos: CorreoSospechoso[] = [];
  totales: Record<ResultadoIngreso, number> = { EXITOSO: 0, FALLIDO: 0, BLOQUEADO: 0 };
  avisoTruncado: string | null = null;
  cargando = false;

  esAdmin: Signal<boolean>;

  constructor(
    private ingresoService: IngresoService,
    private messageService: MessageService,
    authService: AuthService
  ) {
    const desde = new Date();
    desde.setDate(desde.getDate() - (DIAS_POR_DEFECTO - 1));
    this.rango = [desde, new Date()];
    this.esAdmin = computed(() => authService.usuario()?.rol === 'ADMIN');
    this.searchControl.valueChanges.subscribe(() => this.filtrar());
    effect(() => {
      if (this.esAdmin()) {
        this.cargar();
      }
    });
  }

  get total(): number {
    return this.totales.EXITOSO + this.totales.FALLIDO + this.totales.BLOQUEADO;
  }

  /** El calendario de rango emite al elegir cada extremo: se consulta cuando están los dos. */
  rangoElegido(): void {
    if (this.rango?.[0] && this.rango?.[1]) {
      this.cargar();
    }
  }

  cargar(): void {
    const [desde, hasta] = this.rango;
    this.cargando = true;
    this.ingresoService.consultar(desde, hasta).subscribe({
      next: respuesta => {
        const consulta = respuesta.data;
        this.totales = { EXITOSO: consulta.exitosos, FALLIDO: consulta.fallidos, BLOQUEADO: consulta.bloqueados };
        this.avisoTruncado = consulta.truncado ? respuesta.message : null;
        this.original = consulta.filas.map(f => ({
          ...f, navegadorCorto: navegadorCorto(f.navegador), ...RESULTADO_INGRESO[f.resultado]
        }));
        this.sospechosos = this.calcularSospechosos(this.original);
        this.cargando = false;
        this.filtrar();
      },
      error: error => {
        this.cargando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  filtrarPorResultado(resultado: ResultadoIngreso | null): void {
    this.filtroResultado = resultado;
    this.filtrar();
  }

  /** Desde el recuadro: ver todos los intentos de ese correo. */
  verCorreo(correo: string): void {
    this.filtroResultado = null;
    this.searchControl.setValue(correo);
  }

  filtrar(): void {
    const termino = normalizar(this.searchControl.value.trim());
    this.lstIngresos = this.original.filter(f =>
      (!this.filtroResultado || f.resultado === this.filtroResultado)
      && (!termino || [f.correo, f.nombreUsuario, f.ip].some(campo => normalizar(campo).includes(termino))));
  }

  /**
   * Los correos con más intentos fallidos o bloqueados del rango, de más a menos (empate: el más reciente). Las
   * filas llegan de la más reciente a la más antigua, así que la primera de cada correo es su último intento.
   */
  private calcularSospechosos(filas: IngresoFila[]): CorreoSospechoso[] {
    const porCorreo = new Map<string, CorreoSospechoso>();
    for (const f of filas) {
      if (f.resultado === 'EXITOSO') {
        continue;
      }
      const actual = porCorreo.get(f.correo)
        ?? { correo: f.correo, nombreUsuario: f.nombreUsuario, fallidos: 0, bloqueados: 0, ultimo: f.fecha };
      if (f.resultado === 'FALLIDO') {
        actual.fallidos++;
      } else {
        actual.bloqueados++;
      }
      porCorreo.set(f.correo, actual);
    }
    return [...porCorreo.values()]
      .sort((a, b) => (b.fallidos + b.bloqueados) - (a.fallidos + a.bloqueados) || b.ultimo.localeCompare(a.ultimo))
      .slice(0, MAXIMO_SOSPECHOSOS);
  }

}
