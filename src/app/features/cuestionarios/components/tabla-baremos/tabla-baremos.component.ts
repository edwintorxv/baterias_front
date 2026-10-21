import { DecimalPipe } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { COLOR_NIVEL } from '../../../clientes/models/informe-empresa.model';
import { NIVEL_ESTRES } from '../../../clientes/models/informe-individual.model';
import { Baremo } from '../../models/estructura-cuestionario.model';

interface FilaBaremo {
    idNivel: number;
    nivel: string;
    /** Rango por grupo ocupacional, en el orden de {@link TablaBaremosComponent.grupos}. */
    rangos: (Baremo | undefined)[];
}

/**
 * Baremos de un puntaje: una fila por nivel de riesgo (con su color semáforo) y una columna por grupo
 * ocupacional con el rango del puntaje transformado.
 */
@Component({
    selector: 'app-tabla-baremos',
    standalone: true,
    imports: [DecimalPipe],
    templateUrl: './tabla-baremos.component.html',
    styleUrl: './tabla-baremos.component.scss'
})
export class TablaBaremosComponent implements OnChanges {

    @Input({ required: true }) baremos!: Baremo[];
    /** Nombre de cada grupo ocupacional por id (encabezado de las columnas). */
    @Input() nombresGrupo: Partial<Record<number, string>> = {};
    /** Los niveles se muestran como en el manual de estrés (Muy bajo … Muy alto). */
    @Input() estres = false;

    readonly colorNivel = COLOR_NIVEL;
    grupos: number[] = [];
    filas: FilaBaremo[] = [];

    ngOnChanges(): void {
        this.grupos = [...new Set(this.baremos.map(b => b.idGrupoOcupacional))].sort((a, b) => a - b);
        const niveles = new Map<number, string>();
        this.baremos.forEach(b => niveles.set(b.idNivelRiesgo, this.estres ? NIVEL_ESTRES[b.idNivelRiesgo] : b.nivelRiesgo));
        this.filas = [...niveles.entries()]
            .sort(([a], [b]) => a - b)
            .map(([idNivel, nivel]) => ({
                idNivel,
                nivel,
                rangos: this.grupos.map(g => this.baremos.find(b => b.idNivelRiesgo === idNivel && b.idGrupoOcupacional === g))
            }));
    }

}
