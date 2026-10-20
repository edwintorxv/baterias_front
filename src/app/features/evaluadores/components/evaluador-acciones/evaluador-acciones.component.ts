import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Evaluador } from '../../models/evaluador.model';

/**
 * Tarjetas con lo que se puede hacer con un evaluador (mismo estilo que las de clientes y usuarios).
 * Editar: solo el ADMIN. Firma: el ADMIN o el propio evaluador.
 */
@Component({
  selector: 'app-evaluador-acciones',
  standalone: true,
  templateUrl: './evaluador-acciones.component.html',
  styleUrl: './evaluador-acciones.component.scss'
})
export class EvaluadorAccionesComponent {

  @Input({ required: true }) evaluador!: Evaluador;
  @Input() esAdmin = false;
  @Input() esPropio = false;
  @Output() editar = new EventEmitter<Evaluador>();
  @Output() firma = new EventEmitter<Evaluador>();

  get puedeFirma(): boolean {
    return this.esAdmin || this.esPropio;
  }

}
