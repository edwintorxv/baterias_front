import { DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CategoriaCantidad } from '../../models/informe-empresa.model';

/**
 * Personas por categoría de una variable (sexo, rango de edad…): tabla con cantidad, % y una barra de un solo
 * color (no son niveles de riesgo: no lleva colores semáforo). Las categorías van en el orden del backend.
 */
@Component({
  selector: 'app-distribucion-categorias',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './distribucion-categorias.component.html',
  styleUrl: './distribucion-categorias.component.scss'
})
export class DistribucionCategoriasComponent {

  @Input({ required: true }) titulo!: string;
  @Input({ required: true }) categorias!: CategoriaCantidad[];
  @Input() total?: number;

}
