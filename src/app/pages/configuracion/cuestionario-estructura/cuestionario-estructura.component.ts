import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Signal, computed, effect } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AccordionModule } from 'primeng/accordion';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { TablaBaremosComponent } from '../../../features/cuestionarios/components/tabla-baremos/tabla-baremos.component';
import {
  CONDICION_APLICACION,
  Cuestionario,
  DimensionEstructura,
  EstructuraCuestionario,
  METODO_CALCULO,
  PreguntaEstructura,
  TotalGeneral
} from '../../../features/cuestionarios/models/estructura-cuestionario.model';
import { CuestionarioService } from '../../../features/cuestionarios/services/cuestionario.service';

/** Pestaña de los baremos del total general (las demás son el id del cuestionario). */
const TOTAL_GENERAL = 'TG';

interface PreguntaEncontrada {
  pregunta: PreguntaEstructura;
  dimension: string;
  dominio: string | null;
}

const normalizar = (texto: string | null | undefined) =>
  (texto ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/**
 * Configuración de los cuestionarios en solo lectura (ADMIN y PSICOLOGO): una pestaña por cuestionario con su
 * método de cálculo, escalas, baremos y la estructura dominios → dimensiones → preguntas (en C y D, solo
 * dimensiones), y una pestaña con los baremos del total general. Se cambia con migraciones del backend.
 */
@Component({
  selector: 'app-cuestionario-estructura',
  standalone: true,
  imports: [
    DecimalPipe,
    NgTemplateOutlet,
    ReactiveFormsModule,
    AccordionModule,
    CardModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    MessageModule,
    ProgressSpinnerModule,
    TableModule,
    TabsModule,
    TagModule,
    TablaBaremosComponent
  ],
  templateUrl: './cuestionario-estructura.component.html',
  styleUrl: './cuestionario-estructura.component.scss'
})
export class CuestionarioEstructuraComponent {

  readonly TOTAL_GENERAL = TOTAL_GENERAL;
  readonly metodos = METODO_CALCULO;
  readonly condiciones = CONDICION_APLICACION;

  cuestionarios: Cuestionario[] = [];
  pestana: number | string | null = null;
  cargando = false;

  estructura?: EstructuraCuestionario;
  totalGeneral: TotalGeneral[] = [];
  nombresGrupo: Record<number, string> = {};

  /** Opciones de todas las escalas del cuestionario (filas de la tabla de escalas), en el orden de la escala. */
  opcionesEscala: { id: number; nombre: string }[] = [];
  private nombresEscala = new Map<number, string>();
  private valoresEscala = new Map<string, number>();

  searchControl = new FormControl('', { nonNullable: true });
  encontradas: PreguntaEncontrada[] = [];

  puedeVer: Signal<boolean>;

  constructor(
    private cuestionarioService: CuestionarioService,
    private catalogoService: CatalogoService,
    private messageService: MessageService,
    authService: AuthService
  ) {
    this.puedeVer = computed(() => ['ADMIN', 'PSICOLOGO'].includes(authService.usuario()?.rol ?? ''));
    this.searchControl.valueChanges.subscribe(() => this.buscar());
    // Se recarga al cambiar de usuario de prueba.
    effect(() => {
      if (this.puedeVer()) {
        this.cargarCuestionarios();
      } else {
        this.cuestionarios = [];
        this.estructura = undefined;
      }
    });
  }

  get esDeDominios(): boolean {
    return this.estructura?.metodoCalculo === 'SUMA_POR_DOMINIOS';
  }

  get esEstres(): boolean {
    return this.estructura?.metodoCalculo === 'PROMEDIO_PONDERADO';
  }

  /** En C y D el único dominio solo agrupa: se muestran sus dimensiones directamente. */
  get dimensionesSueltas(): DimensionEstructura[] {
    return this.estructura?.dominios.flatMap(d => d.dimensiones) ?? [];
  }

  get totalDimensiones(): number {
    return this.dimensionesSueltas.length;
  }

  cargarCuestionarios(): void {
    this.catalogoService.gruposOcupacionales().subscribe({
      next: grupos => this.nombresGrupo = Object.fromEntries(grupos.map(g => [g.id, g.nombre]))
    });
    this.cuestionarioService.listar().subscribe({
      next: cuestionarios => {
        this.cuestionarios = cuestionarios;
        if (cuestionarios.length && this.pestana === null) {
          this.cambiarPestana(cuestionarios[0].id);
        }
      },
      error: error => ResponseHandlerUtil.handleError(error, this.messageService)
    });
  }

  cambiarPestana(valor: number | string | undefined): void {
    if (valor === undefined) {
      return;
    }
    this.pestana = valor;
    this.searchControl.setValue('', { emitEvent: false });
    this.encontradas = [];
    this.cargando = true;
    if (valor === TOTAL_GENERAL) {
      this.cuestionarioService.totalGeneral().subscribe({
        next: total => {
          if (this.pestana === TOTAL_GENERAL) {
            this.totalGeneral = total;
            this.cargando = false;
          }
        },
        error: error => this.fallo(error)
      });
      return;
    }
    this.cuestionarioService.estructura(Number(valor)).subscribe({
      next: estructura => {
        if (this.pestana === estructura.id) {
          this.mostrar(estructura);
          this.cargando = false;
        }
      },
      error: error => this.fallo(error)
    });
  }

  condicion(dimension: DimensionEstructura): string | null {
    return dimension.condicionAplicacion ? this.condiciones[dimension.condicionAplicacion] : null;
  }

  nombreEscala(id: number): string {
    return (this.nombresEscala.get(id) ?? '').replace(/^Escala /i, '');
  }

  valorOpcion(idEscala: number, idOpcion: number): number | undefined {
    return this.valoresEscala.get(`${idEscala}-${idOpcion}`);
  }

  /** Por número exacto o por texto de la pregunta, sin distinguir tildes ni mayúsculas. */
  buscar(): void {
    const termino = normalizar(this.searchControl.value.trim());
    if (!termino || !this.estructura) {
      this.encontradas = [];
      return;
    }
    this.encontradas = this.estructura.dominios.flatMap(dominio => dominio.dimensiones.flatMap(dimension =>
      dimension.preguntas
        .filter(p => String(p.numero) === termino || normalizar(p.descripcion).includes(termino))
        .map(pregunta => ({ pregunta, dimension: dimension.nombre, dominio: this.esDeDominios ? dominio.nombre : null }))));
  }

  private mostrar(estructura: EstructuraCuestionario): void {
    this.estructura = estructura;
    this.nombresEscala = new Map(estructura.escalas.map(e => [e.id, e.nombre]));
    this.valoresEscala = new Map(estructura.escalas.flatMap(e => e.opciones.map(o => [`${e.id}-${o.id}`, o.valor] as const)));
    const opciones = new Map<number, string>();
    estructura.escalas.forEach(e => e.opciones.forEach(o => opciones.set(o.id, o.nombre)));
    this.opcionesEscala = [...opciones.entries()].sort(([a], [b]) => a - b).map(([id, nombre]) => ({ id, nombre }));
  }

  private fallo(error: HttpErrorResponse): void {
    this.cargando = false;
    ResponseHandlerUtil.handleError(error, this.messageService);
  }

}
