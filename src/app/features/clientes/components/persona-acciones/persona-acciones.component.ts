import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PersonaCliente } from '../../models/persona-cliente.model';

/** Tarjetas con lo que se puede hacer con una persona del cliente (mismo estilo que las del cliente). */
@Component({
  selector: 'app-persona-acciones',
  standalone: true,
  templateUrl: './persona-acciones.component.html',
  styleUrl: './persona-acciones.component.scss'
})
export class PersonaAccionesComponent {

  @Input({ required: true }) persona!: PersonaCliente;
  @Output() editar = new EventEmitter<PersonaCliente>();
  @Output() cambiarEstado = new EventEmitter<PersonaCliente>();
  @Output() informe = new EventEmitter<PersonaCliente>();

}
