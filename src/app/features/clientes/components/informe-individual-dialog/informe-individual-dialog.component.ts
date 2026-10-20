import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { Observable, forkJoin, of } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { guardarArchivo } from '../../../../core/utils/archivo.util';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { AplicacionService } from '../../../aplicaciones/services/aplicacion.service';
import { Evaluador } from '../../../evaluadores/models/evaluador.model';
import { EvaluadorService } from '../../../evaluadores/services/evaluador.service';
import { COLOR_NIVEL } from '../../models/informe-empresa.model';
import {
  AplicacionInforme,
  InformeIndividual,
  NIVEL_ESTRES,
  ResultadoCuestionario,
  TITULO_FORMA
} from '../../models/informe-individual.model';
import { PersonaCliente } from '../../models/persona-cliente.model';
import { FormatoInforme, InformeIndividualService } from '../../services/informe-individual.service';

interface OpcionFirmante {
  id: number;
  nombre: string;
}

/** Una aplicación del año con su formulario (firmante, observaciones y recomendaciones). */
interface AplicacionFicha {
  aplicacion: AplicacionInforme;
  form: FormGroup;
  firmantes: OpcionFirmante[];
  guardando: boolean;
}

/**
 * Informe individual de una persona (historia clínica ocupacional; solo el psicólogo asignado al cliente).
 * Por año: resultados de cada aplicación, lo que completa el profesional y la descarga en PDF o Word.
 * Firmante: el propio psicólogo (si está activo) o el que ya tenía la aplicación; el backend no deja quitarlo.
 */
@Component({
  selector: 'app-informe-individual-dialog',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, ReactiveFormsModule, ButtonModule, MessageModule, SelectModule,
    TagModule, TextareaModule],
  templateUrl: './informe-individual-dialog.component.html',
  styleUrl: './informe-individual-dialog.component.scss'
})
export class InformeIndividualDialogComponent implements OnInit {

  @Input({ required: true }) idCliente!: number;
  @Input({ required: true }) persona!: PersonaCliente;

  readonly colorNivel = COLOR_NIVEL;
  readonly tituloForma = TITULO_FORMA;

  lstAnios: number[] = [];
  anio: number | null = null;
  informe?: InformeIndividual;
  fichas: AplicacionFicha[] = [];
  /** Dominios y dimensiones abiertos, por "aplicación-forma". */
  abiertos = new Set<string>();
  cargando = false;
  descargando: FormatoInforme | null = null;

  private propio: Evaluador | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private informeIndividualService: InformeIndividualService,
    private aplicacionService: AplicacionService,
    private evaluadorService: EvaluadorService,
    private authService: AuthService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    const idEvaluador = this.authService.usuario()?.idEvaluador;
    const propio: Observable<Evaluador | null> = idEvaluador ? this.evaluadorService.obtener(idEvaluador) : of(null);

    this.cargando = true;
    forkJoin({
      anios: this.informeIndividualService.anios(this.idCliente, this.persona.idEvaluado),
      propio
    }).subscribe({
      next: ({ anios, propio }) => {
        this.propio = propio;
        this.lstAnios = [...anios].sort((a, b) => b - a);
        this.anio = this.lstAnios[0] ?? null;
        if (this.anio) {
          this.consultar();
        } else {
          this.cargando = false;
        }
      },
      error: error => {
        this.cargando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  consultar(): void {
    if (!this.anio) {
      return;
    }
    this.cargando = true;
    this.informeIndividualService.consultar(this.idCliente, this.persona.idEvaluado, this.anio).subscribe({
      next: informe => {
        this.cargando = false;
        this.informe = informe;
        this.fichas = informe.aplicaciones.map(aplicacion => this.ficha(aplicacion));
        this.abiertos.clear();
      },
      error: error => {
        this.cargando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  guardar(ficha: AplicacionFicha): void {
    const valor = ficha.form.getRawValue();
    const texto = (v: string | null) => v?.trim() || null;
    ficha.guardando = true;
    this.aplicacionService.guardarDatosInforme(ficha.aplicacion.fkAplicacion, {
      fkEvaluador: valor.fkEvaluador,
      observaciones: texto(valor.observaciones),
      recomendaciones: texto(valor.recomendaciones)
    }).subscribe({
      next: response => {
        ficha.guardando = false;
        ResponseHandlerUtil.handleResponse(response, this.messageService);
        // Se vuelve a consultar para traer el evaluador con sus datos (nombre, firma) tal como sale en el archivo.
        this.consultar();
      },
      error: error => {
        ficha.guardando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  descargar(formato: FormatoInforme): void {
    if (!this.anio) {
      return;
    }
    this.descargando = formato;
    this.informeIndividualService.descargar(this.idCliente, this.persona.idEvaluado, this.anio, formato).subscribe({
      next: archivo => {
        this.descargando = null;
        guardarArchivo(archivo);
      },
      error: error => {
        this.descargando = null;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  /** Lo que impide descargar el archivo del año (lo mismo que valida el backend, más los cambios sin guardar). */
  get faltantes(): string[] {
    const faltantes: string[] = [];
    for (const { aplicacion, form } of this.fichas) {
      const cual = `Aplicación del ${this.fecha(aplicacion.fechaAplicacion)}`;
      if (aplicacion.estadoResultados !== 'CALCULADO') {
        faltantes.push(`${cual}: sin resultados calculados.`);
      }
      if (!aplicacion.evaluador) {
        faltantes.push(`${cual}: falta el profesional que firma.`);
      }
      if (form.dirty) {
        faltantes.push(`${cual}: hay cambios sin guardar.`);
      }
    }
    return faltantes;
  }

  /** No impiden descargar, pero el archivo sale incompleto. */
  get avisos(): string[] {
    return this.fichas
      .filter(f => f.aplicacion.evaluador && !f.aplicacion.evaluador.tieneFirma)
      .map(f => `${f.aplicacion.evaluador!.nombre} no tiene firma cargada: el informe sale sin firma.`)
      .filter((aviso, i, todos) => todos.indexOf(aviso) === i);
  }

  /** Intralaboral (A o B), extralaboral (C) y estrés (D), en ese orden. */
  cuestionarios(aplicacion: AplicacionInforme): ResultadoCuestionario[] {
    return [...(aplicacion.resultados?.cuestionarios ?? [])].sort((a, b) => a.forma.localeCompare(b.forma));
  }

  /** El estrés se muestra como en el manual (Muy bajo…Muy alto); el resto con el nombre del nivel. */
  nivel(cuestionario: ResultadoCuestionario): string {
    return cuestionario.forma === 'D' ? NIVEL_ESTRES[cuestionario.fkNivelRiesgo] : cuestionario.nivelRiesgo;
  }

  /** Intralaboral y extralaboral: dominios y dimensiones; estrés: los síntomas frecuentes. */
  tieneDetalle(cuestionario: ResultadoCuestionario, aplicacion: AplicacionInforme): boolean {
    return cuestionario.forma === 'D'
      ? aplicacion.sintomasFrecuentes.length > 0
      : cuestionario.dominios.length > 0 || cuestionario.dimensiones.length > 0;
  }

  sinSintomasFrecuentes(aplicacion: AplicacionInforme): boolean {
    return aplicacion.sintomasFrecuentes.every(grupo => !grupo.sintomas.length);
  }

  alternar(clave: string): void {
    if (!this.abiertos.delete(clave)) {
      this.abiertos.add(clave);
    }
  }

  private ficha(aplicacion: AplicacionInforme): AplicacionFicha {
    // Sin largo máximo: en la BD son TEXT.
    return {
      aplicacion,
      firmantes: this.firmantes(aplicacion),
      guardando: false,
      form: this.formBuilder.group({
        fkEvaluador: [aplicacion.evaluador?.id ?? null],
        observaciones: [aplicacion.observaciones ?? ''],
        recomendaciones: [aplicacion.recomendaciones ?? '']
      })
    };
  }

  /** El propio (si está activo) y el que ya tenía la aplicación, sin repetir. */
  private firmantes(aplicacion: AplicacionInforme): OpcionFirmante[] {
    const opciones: OpcionFirmante[] = [];
    if (this.propio?.activo) {
      opciones.push({ id: this.propio.id, nombre: this.propio.nombre });
    }
    const actual = aplicacion.evaluador;
    if (actual && actual.id !== this.propio?.id) {
      opciones.push({ id: actual.id, nombre: actual.nombre });
    }
    return opciones;
  }

  private fecha(valor: string): string {
    const [anio, mes, dia] = valor.substring(0, 10).split('-');
    return `${dia}/${mes}/${anio}`;
  }

}
