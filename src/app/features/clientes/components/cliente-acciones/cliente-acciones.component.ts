import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ClienteFila } from '../../models/cliente.model';

/** Tarjetas con lo que se puede hacer con un cliente (mismo estilo que control documental). */
@Component({
  selector: 'app-cliente-acciones',
  standalone: true,
  templateUrl: './cliente-acciones.component.html',
  styleUrl: './cliente-acciones.component.scss'
})
export class ClienteAccionesComponent {

  @Input({ required: true }) cliente!: ClienteFila;
  /** Editar es solo del administrador (el backend responde 403 a los demás). */
  @Input() puedeEditar = false;
  /** Personas es del psicólogo: el administrador no ve datos de trabajadores. */
  @Input() puedeVerPersonas = false;
  @Output() editar = new EventEmitter<ClienteFila>();
  @Output() personas = new EventEmitter<ClienteFila>();

}
