import { Component, EventEmitter, Output, Signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { UsuarioPrueba } from '../../../../environments/environment.model';
import { NOMBRE_ROL, UsuarioSesion } from '../../../core/models/sesion.model';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [ButtonModule, SelectModule, TagModule, TooltipModule, FormsModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {

  @Output() menuClick = new EventEmitter<void>();

  /** Solo desarrollo: cambiar de usuario sin pantalla de login. */
  usuariosPrueba: UsuarioPrueba[];
  cambiando = false;

  usuario: Signal<UsuarioSesion | null>;
  rol: Signal<string>;

  constructor(
    private authService: AuthService,
    public themeService: ThemeService,
    private messageService: MessageService
  ) {
    this.usuariosPrueba = authService.usuariosPrueba();
    this.usuario = authService.usuario;
    this.rol = computed(() => {
      const usuario = this.usuario();
      return usuario ? NOMBRE_ROL[usuario.rol] : '';
    });
  }

  openMenu(): void {
    this.menuClick.emit();
  }

  cambiarUsuario(usuario: string): void {
    const prueba = this.usuariosPrueba.find(u => u.usuario === usuario);
    if (!prueba) {
      return;
    }
    this.cambiando = true;
    this.authService.login(prueba.usuario, prueba.contrasena).subscribe({
      next: sesion => {
        this.cambiando = false;
        this.messageService.add({
          severity: 'info', summary: 'Usuario de prueba', detail: `Ahora es ${sesion.nombre}`, life: 3000
        });
      },
      error: error => {
        this.cambiando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

}
