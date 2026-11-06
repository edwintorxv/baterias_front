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
  /** El usuario de la sesión: a sí mismo no se genera el enlace (para eso está cambiar su contraseña). */
  @Input() idUsuarioSesion: number | null = null;
  @Output() clientes = new EventEmitter<Usuario>();
  @Output() editar = new EventEmitter<Usuario>();
  @Output() enlace = new EventEmitter<Usuario>();

  get esPsicologo(): boolean {
    return this.usuario.rol === 'PSICOLOGO';
  }

  /** Por qué no se puede generar el enlace (null = se puede); el backend responde 409 en los mismos casos. */
  get motivoSinEnlace(): string | null {
    if (this.usuario.id === this.idUsuarioSesion) {
      return 'A usted mismo no: cambie su contraseña desde el menú de su nombre.';
    }
    return this.usuario.activo ? null : 'El usuario está inactivo: actívelo primero.';
  }

}
