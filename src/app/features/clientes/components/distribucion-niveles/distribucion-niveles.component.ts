import { DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { COLOR_NIVEL, DistribucionNiveles } from '../../models/informe-empresa.model';

/** Una tabla de personas por nivel de riesgo, con una barra por nivel en el color semáforo del Word. */
@Component({
  selector: 'app-distribucion-niveles',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './distribucion-niveles.component.html',
  styleUrl: './distribucion-niveles.component.scss'
})
export class DistribucionNivelesComponent {

  @Input({ required: true }) titulo!: string;
  @Input({ required: true }) distribucion!: DistribucionNiveles;

  readonly colorNivel = COLOR_NIVEL;

}
