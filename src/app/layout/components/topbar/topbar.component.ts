import { Component, EventEmitter, Output, Signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
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
  imports: [ButtonModule, MenuModule, SelectModule, TagModule, TooltipModule, FormsModule],
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

  /** Menú del usuario (clic en su nombre): el psicólogo además tiene su firma. */
  opcionesUsuario: Signal<MenuItem[]>;

  constructor(
    private authService: AuthService,
    public themeService: ThemeService,
    private messageService: MessageService,
    private router: Router
  ) {
    this.usuariosPrueba = authService.usuariosPrueba();
    this.usuario = authService.usuario;
    this.opcionesUsuario = computed(() => [
      ...(this.usuario()?.rol === 'PSICOLOGO'
        ? [{ label: 'Mi firma', icon: 'pi pi-pencil', command: () => this.router.navigate(['/mi-firma']) }]
        : []),
      { label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: () => this.cerrarSesion() }
    ]);
    this.rol = computed(() => {
      const usuario = this.usuario();
      return usuario ? NOMBRE_ROL[usuario.rol] : '';
    });
  }

  openMenu(): void {
    this.menuClick.emit();
  }

  /**
   * Se cierra la sesión local (el token JWT no se revoca en el servidor: vence a las 8 h). Primero se borra la
   * sesión y luego se navega: con la sesión vigente, el guard del login devolvería al Inicio.
   */
  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  cambiarUsuario(usuario: string): void {
    const prueba = this.usuariosPrueba.find(u => u.usuario === usuario);
    if (!prueba) {
      return;
    }
    this.cambiando = true;
    const rolAnterior = this.usuario()?.rol;
    this.authService.login(prueba.usuario, prueba.contrasena).subscribe({
      next: sesion => {
        this.cambiando = false;
        // Con otro rol la pantalla actual puede no estar permitida (los guards solo corren al navegar).
        if (sesion.rol !== rolAnterior) {
          this.router.navigateByUrl('/inicio');
        }
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
