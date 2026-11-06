import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { Usuario } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';

/**
 * Confirmar y enviar el enlace para definir la contraseña (solo ADMIN). Se usa cuando al usuario se le olvidó y
 * llamó por teléfono, o cuando no alcanzó a usar la invitación. El administrador nunca ve el enlace: va solo
 * por correo.
 */
@Component({
  selector: 'app-usuario-enlace-dialog',
  standalone: true,
  imports: [ButtonModule, MessageModule],
  templateUrl: './usuario-enlace-dialog.component.html',
  styleUrl: './usuario-enlace-dialog.component.scss'
})
export class UsuarioEnlaceDialogComponent {

  @Input({ required: true }) usuario!: Usuario;
  @Output() done = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  enviando = false;

  constructor(
    private usuarioService: UsuarioService,
    private messageService: MessageService
  ) { }

  enviar(): void {
    this.enviando = true;
    this.usuarioService.generarEnlaceContrasena(this.usuario.id).subscribe({
      next: response => {
        this.enviando = false;
        ResponseHandlerUtil.handleResponse(response, this.messageService);
        this.done.emit();
      },
      error: error => {
        this.enviando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

}
