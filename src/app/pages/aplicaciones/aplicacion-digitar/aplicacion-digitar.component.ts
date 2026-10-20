import { DatePipe, Location } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { forkJoin, switchMap } from 'rxjs';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { ResultadosAplicacionComponent } from '../../../features/aplicaciones/components/resultados-aplicacion/resultados-aplicacion.component';
import { Aplicacion } from '../../../features/aplicaciones/models/aplicacion.model';
import {
  CondicionAplicacion,
  CuestionarioFormulario,
  ESTADO_APLICACION,
  FormularioAplicacion,
  PREGUNTA_FILTRO,
  PreguntaFormulario
} from '../../../features/aplicaciones/models/formulario-aplicacion.model';
import { AplicacionService } from '../../../features/aplicaciones/services/aplicacion.service';
import { ResultadosAplicacion, TITULO_FORMA } from '../../../features/clientes/models/informe-individual.model';
import { ClienteService } from '../../../features/clientes/services/cliente.service';
import { EvaluadoClienteService } from '../../../features/evaluados/services/evaluado-cliente.service';
import { EvaluadoService } from '../../../features/evaluados/services/evaluado.service';

/** Fila de la pestaña: la pregunta y, si es la primera de un bloque condicionado, su pregunta filtro antes. */
interface Fila {
  pregunta: PreguntaFormulario;
  filtroAntes: CondicionAplicacion | null;
}

/**
 * Digitación de una aplicación (cuestionarios en papel): una pestaña por cuestionario, opciones como botones
 * y teclado (1–5 responde y pasa a la siguiente; ↑ ↓ mueven; 0 o Supr borran). Guardar reemplaza las
 * respuestas del cuestionario; si cambian y había resultados, el backend los borra (pendiente de cálculo).
 * Calcular solo con todo respondido y guardado (el backend también lo exige).
 */
@Component({
  selector: 'app-aplicacion-digitar',
  standalone: true,
  imports: [DatePipe, FormsModule, ButtonModule, MessageModule, ProgressBarModule, SelectButtonModule,
    TabsModule, TagModule, ResultadosAplicacionComponent],
  templateUrl: './aplicacion-digitar.component.html',
  styleUrl: './aplicacion-digitar.component.scss'
})
export class AplicacionDigitarComponent implements OnInit {

  @ViewChildren('filaDom') filasDom!: QueryList<ElementRef<HTMLElement>>;

  readonly estados = ESTADO_APLICACION;
  readonly tituloForma = TITULO_FORMA;
  readonly preguntaFiltro = PREGUNTA_FILTRO;
  readonly siNo = [{ label: 'Sí', value: true }, { label: 'No', value: false }];

  readonly idAplicacion: number;
  /** Se llegó navegando dentro de la app (no por URL ni recargando): la flecha vuelve a donde estaba. */
  private readonly vieneDeLaApp: boolean;
  aplicacion?: Aplicacion;
  formulario?: FormularioAplicacion;
  persona = '';
  documento = '';
  empresa = '';
  idCliente: number | null = null;

  /** Pestaña abierta (id del cuestionario). */
  pestana: number | null = null;
  /** Respuesta elegida por pregunta (lo de la pantalla, guardado o no). */
  seleccion = new Map<number, number | null>();
  /** Cuestionarios con cambios sin guardar. */
  conCambios = new Set<number>();
  /** Fila con el foco en la pestaña abierta. */
  actual = 0;
  filas: Fila[] = [];

  /** Solo cuando la aplicación está calculada. */
  resultados?: ResultadosAplicacion;

  cargando = false;
  guardando = false;
  guardandoFiltro = false;
  calculando = false;

  constructor(
    route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private aplicacionService: AplicacionService,
    private evaluadoClienteService: EvaluadoClienteService,
    private evaluadoService: EvaluadoService,
    private clienteService: ClienteService,
    private messageService: MessageService
  ) {
    this.idAplicacion = Number(route.snapshot.paramMap.get('id'));
    this.vieneDeLaApp = !!router.getCurrentNavigation()?.previousNavigation;
  }

  /** A la pantalla anterior (Personas o el listado); entrando por URL, a Personas de su empresa. */
  volver(): void {
    if (this.vieneDeLaApp) {
      this.location.back();
    } else {
      this.router.navigate(this.idCliente ? ['/clientes', this.idCliente, 'personas'] : ['/aplicaciones']);
    }
  }

  ngOnInit(): void {
    this.cargando = true;
    this.aplicacionService.obtener(this.idAplicacion).pipe(
      switchMap(aplicacion => {
        this.aplicacion = aplicacion;
        return this.evaluadoClienteService.obtener(aplicacion.fkEvaluadoCliente);
      }),
      switchMap(relacion => forkJoin({
        evaluado: this.evaluadoService.obtener(relacion.fkEvaluado),
        cliente: this.clienteService.obtener(relacion.fkCliente),
        formulario: this.aplicacionService.formulario(this.idAplicacion)
      }))
    ).subscribe({
      next: ({ evaluado, cliente, formulario }) => {
        this.cargando = false;
        this.persona = `${evaluado.apellido} ${evaluado.nombre}`;
        this.documento = evaluado.numeroIdentificacion;
        this.empresa = cliente.nombre;
        this.idCliente = cliente.id;
        this.aplicarFormulario(formulario);
      },
      error: error => {
        this.cargando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  get cuestionario(): CuestionarioFormulario | undefined {
    return this.formulario?.cuestionarios.find(c => c.id === this.pestana);
  }

  get hayCambios(): boolean {
    return this.conCambios.size > 0;
  }

  /** Preguntas que aplican sin respuesta guardada, de todos los cuestionarios. */
  get faltantes(): number {
    return (this.formulario?.cuestionarios ?? []).reduce((total, c) => total + c.aplicables - c.respondidas, 0);
  }

  get puedeCalcular(): boolean {
    return this.formulario?.estado === 'PENDIENTE_CALCULO' && !this.hayCambios && !this.calculando;
  }

  calcular(): void {
    if (!this.puedeCalcular) {
      return;
    }
    this.calculando = true;
    this.aplicacionService.calcular(this.idAplicacion).pipe(
      switchMap(response => {
        ResponseHandlerUtil.handleResponse(response, this.messageService);
        this.resultados = response.data;
        return this.aplicacionService.formulario(this.idAplicacion);
      })
    ).subscribe({
      next: formulario => {
        this.calculando = false;
        this.aplicarFormulario(formulario);
      },
      error: error => {
        this.calculando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  /** Respondidas en pantalla (incluye lo no guardado) de las que aplican. */
  respondidas(cuestionario: CuestionarioFormulario): number {
    return cuestionario.preguntas.filter(p => p.aplica && this.seleccion.get(p.id) != null).length;
  }

  cambiarPestana(id: number | string | undefined): void {
    this.pestana = Number(id);
    this.armarFilas();
    this.actual = this.siguienteSinResponder(0);
    setTimeout(() => this.enfocar(this.actual));
  }

  elegir(indice: number, idOpcion: number): void {
    const pregunta = this.filas[indice]?.pregunta;
    if (!pregunta?.aplica || !this.pestana) {
      return;
    }
    this.seleccion.set(pregunta.id, idOpcion);
    this.marcarCambio();
    this.mover(this.siguienteAplicable(indice, 1));
  }

  borrar(indice: number): void {
    const pregunta = this.filas[indice]?.pregunta;
    if (pregunta?.aplica && this.seleccion.get(pregunta.id) != null) {
      this.seleccion.set(pregunta.id, null);
      this.marcarCambio();
    }
  }

  /** 1–n responde con esa opción y pasa a la siguiente; ↑ ↓ mueven; 0, Supr o Retroceso borran. */
  teclado(evento: KeyboardEvent, indice: number): void {
    const pregunta = this.filas[indice].pregunta;
    if (/^[1-9]$/.test(evento.key)) {
      const opcion = pregunta.opciones[Number(evento.key) - 1];
      if (opcion) {
        evento.preventDefault();
        this.elegir(indice, opcion.id);
      }
    } else if (evento.key === 'ArrowDown' || evento.key === 'Enter') {
      evento.preventDefault();
      this.mover(this.siguienteAplicable(indice, 1));
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      this.mover(this.siguienteAplicable(indice, -1));
    } else if (['0', 'Delete', 'Backspace'].includes(evento.key)) {
      evento.preventDefault();
      this.borrar(indice);
    }
  }

  mover(indice: number): void {
    this.actual = indice;
    this.enfocar(indice);
  }

  guardar(): void {
    const cuestionario = this.cuestionario;
    if (!cuestionario) {
      return;
    }
    const respuestas = cuestionario.preguntas
      .filter(p => p.aplica && this.seleccion.get(p.id) != null)
      .map(p => ({ fkPregunta: p.id, fkOpcionRespuesta: this.seleccion.get(p.id)! }));
    this.guardando = true;
    this.aplicacionService.guardarRespuestas(this.idAplicacion, cuestionario.id, respuestas).subscribe({
      next: response => {
        this.guardando = false;
        ResponseHandlerUtil.handleResponse(response, this.messageService);
        this.conCambios.delete(cuestionario.id);
        this.aplicarFormulario(response.data);
      },
      error: error => {
        this.guardando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  /** Cambiar una pregunta filtro: solo sin cambios pendientes (se recarga el formulario). */
  cambiarFiltro(condicion: CondicionAplicacion, valor: boolean): void {
    if (!this.formulario || this.hayCambios) {
      return;
    }
    const filtros = { atiendeClientes: this.formulario.atiendeClientes, esJefe: this.formulario.esJefe };
    filtros[PREGUNTA_FILTRO[condicion].control] = valor;
    this.guardandoFiltro = true;
    this.aplicacionService.guardarFiltros(this.idAplicacion, filtros).pipe(
      switchMap(() => this.aplicacionService.formulario(this.idAplicacion))
    ).subscribe({
      next: formulario => {
        this.guardandoFiltro = false;
        this.messageService.add({ severity: 'success', summary: 'Pregunta filtro', detail: 'Guardada.' });
        this.aplicarFormulario(formulario);
      },
      error: error => {
        this.guardandoFiltro = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  valorFiltro(condicion: CondicionAplicacion): boolean | null {
    return this.formulario?.[PREGUNTA_FILTRO[condicion].control] ?? null;
  }

  @HostListener('window:beforeunload', ['$event'])
  avisarAlSalir(evento: BeforeUnloadEvent): void {
    if (this.hayCambios) {
      evento.preventDefault();
    }
  }

  /** Toma lo guardado del backend; conserva lo no guardado de los demás cuestionarios. */
  private aplicarFormulario(formulario: FormularioAplicacion): void {
    this.formulario = formulario;
    this.cargarResultados(formulario);
    for (const c of formulario.cuestionarios) {
      if (!this.conCambios.has(c.id)) {
        c.preguntas.forEach(p => this.seleccion.set(p.id, p.respuesta));
      }
    }
    const primeraIncompleta = formulario.cuestionarios.find(c => c.respondidas < c.aplicables) ?? formulario.cuestionarios[0];
    this.cambiarPestana(this.pestana ?? primeraIncompleta?.id);
  }

  /** Al corregir, el backend borra los resultados: el resumen se va con ellos. */
  private cargarResultados(formulario: FormularioAplicacion): void {
    if (formulario.estado !== 'CALCULADA') {
      this.resultados = undefined;
    } else if (!this.resultados) {
      this.aplicacionService.resultados(this.idAplicacion).subscribe({
        next: resultados => this.resultados = resultados,
        error: error => ResponseHandlerUtil.handleError(error, this.messageService)
      });
    }
  }

  private armarFilas(): void {
    const preguntas = this.cuestionario?.preguntas ?? [];
    this.filas = preguntas.map((pregunta, i) => ({
      pregunta,
      filtroAntes: pregunta.condicion && preguntas[i - 1]?.condicion !== pregunta.condicion ? pregunta.condicion : null
    }));
  }

  private marcarCambio(): void {
    this.conCambios.add(this.pestana!);
  }

  /** La siguiente (o anterior) que aplica; si no hay, se queda donde está. */
  private siguienteAplicable(desde: number, paso: 1 | -1): number {
    for (let i = desde + paso; i >= 0 && i < this.filas.length; i += paso) {
      if (this.filas[i].pregunta.aplica) {
        return i;
      }
    }
    return desde;
  }

  private siguienteSinResponder(desde: number): number {
    const i = this.filas.findIndex((f, j) => j >= desde && f.pregunta.aplica && this.seleccion.get(f.pregunta.id) == null);
    return i >= 0 ? i : 0;
  }

  private enfocar(indice: number): void {
    const elemento = this.filasDom?.get(indice)?.nativeElement;
    elemento?.focus({ preventScroll: true });
    elemento?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

}
