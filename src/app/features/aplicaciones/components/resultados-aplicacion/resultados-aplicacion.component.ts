import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { COLOR_NIVEL } from '../../../clientes/models/informe-empresa.model';
import {
  NIVEL_ESTRES,
  ResultadoCuestionario,
  ResultadosAplicacion,
  TITULO_FORMA
} from '../../../clientes/models/informe-individual.model';

/** Resumen de los resultados de una aplicación: puntaje transformado y nivel por cuestionario y total general. */
@Component({
  selector: 'app-resultados-aplicacion',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './resultados-aplicacion.component.html',
  styleUrl: './resultados-aplicacion.component.scss'
})
export class ResultadosAplicacionComponent {

  @Input({ required: true }) resultados!: ResultadosAplicacion;

  readonly colorNivel = COLOR_NIVEL;
  readonly tituloForma = TITULO_FORMA;

  /** Intralaboral (A o B), extralaboral (C) y estrés (D), en ese orden. */
  get cuestionarios(): ResultadoCuestionario[] {
    return [...this.resultados.cuestionarios].sort((a, b) => a.forma.localeCompare(b.forma));
  }

  /** El estrés se muestra como en el manual (Muy bajo…Muy alto); el resto con el nombre del nivel. */
  nivel(cuestionario: ResultadoCuestionario): string {
    return cuestionario.forma === 'D' ? NIVEL_ESTRES[cuestionario.fkNivelRiesgo] : cuestionario.nivelRiesgo;
  }

}
