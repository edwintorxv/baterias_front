import { Component, Input, OnChanges } from '@angular/core';
import { COLOR_NIVEL, DistribucionNiveles } from '../../models/informe-empresa.model';
import { NIVEL_ESTRES } from '../../models/informe-individual.model';
import { BarrasPorGrupoComponent, FilaBarras, SerieBarras } from '../barras-por-grupo/barras-por-grupo.component';

/** Una fila: un dominio, una dimensión, una ciudad o un área, con sus personas por nivel. */
export interface FilaNiveles {
  nombre: string;
  /** Segunda columna opcional (p. ej. el dominio de una dimensión). */
  detalle?: string;
  distribucion: DistribucionNiveles;
}

/** Nombres cortos de los niveles para encabezados y leyenda (el completo va en el tooltip). */
const NIVEL_CORTO: Record<number, string> = { 1: 'Sin riesgo', 2: 'Bajo', 3: 'Medio', 4: 'Alto', 5: 'Muy alto' };

/**
 * Personas por nivel de riesgo de varios grupos: {@link BarrasPorGrupoComponent} con una serie por nivel en los
 * colores semáforo del Word. Las filas van en el orden recibido (el ranking del backend).
 */
@Component({
  selector: 'app-niveles-por-grupo',
  standalone: true,
  imports: [BarrasPorGrupoComponent],
  template: `
    <app-barras-por-grupo [titulo]="titulo" [series]="series" [filas]="filasBarras" [columna]="columna"
      [columnaDetalle]="columnaDetalle" [nota]="nota" [grafico]="grafico" />
  `
})
export class NivelesPorGrupoComponent implements OnChanges {

  @Input({ required: true }) titulo!: string;
  @Input({ required: true }) filas!: FilaNiveles[];
  @Input() columna = 'Grupo';
  @Input() columnaDetalle?: string;
  @Input() nota?: string;
  @Input() grafico = true;
  /** Etiquetas del manual de estrés (Muy bajo … Muy alto). */
  @Input() estres = false;

  series: SerieBarras[] = [];
  filasBarras: FilaBarras[] = [];

  // Se arman aquí (no en la plantilla) para que el gráfico no se rehaga en cada ciclo de detección de cambios.
  ngOnChanges(): void {
    const corto = this.estres ? NIVEL_ESTRES : NIVEL_CORTO;
    this.series = [1, 2, 3, 4, 5].map(id => ({ id, corto: corto[id], color: COLOR_NIVEL[id] }));
    this.filasBarras = this.filas.map(f => ({
      nombre: f.nombre,
      detalle: f.detalle,
      total: f.distribucion.total,
      valores: f.distribucion.niveles.map(n => ({
        id: n.fkNivelRiesgo, nombre: n.nivel, cantidad: n.cantidad, porcentaje: n.porcentaje
      }))
    }));
  }

}
