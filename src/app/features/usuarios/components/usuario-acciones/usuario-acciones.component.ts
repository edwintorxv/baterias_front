import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Usuario } from '../../models/usuario.model';

/** Tarjetas con lo que se puede hacer con un usuario (mismo estilo que las de clientes y personas). */
@Component({
  selector: 'app-usuario-acciones',
  standalone: true,
  templateUrl: './usuario-acciones.component.html',
  styleUrl: './usuario-acciones.component.scss'
})
export class UsuarioAccionesComponent {

  @Input({ required: true }) usuario!: Usuario;
  @Output() clientes = new EventEmitter<Usuario>();

  get esPsicologo(): boolean {
    return this.usuario.rol === 'PSICOLOGO';
  }

}
