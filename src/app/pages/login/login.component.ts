import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { UsuarioPrueba } from '../../../environments/environment.model';
import { rutaInterna } from '../../core/guards/sesion.guard';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ResponseHandlerUtil } from '../../core/utils/response-handler.util';
import { ErrorCampoComponent } from '../../shared/components/error-campo/error-campo.component';
import { CustomValidators } from '../../shared/validators/custom-validators';

/**
 * Inicio de sesión con el correo (fuera del layout). El error del backend se muestra tal cual: "Usuario o contraseña
 * incorrectos" (el mismo exista o no el usuario) o, tras varios intentos fallidos, "Demasiados intentos
 * fallidos. Intente de nuevo en N minutos" (429). Al entrar va a la página que se pidió (?volver=) o al Inicio.
 * En desarrollo se puede entrar con un clic como cualquiera de los usuarios de prueba.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, MessageModule, PasswordModule, ErrorCampoComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  form = new FormGroup({
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100), CustomValidators.correoElectronico]
    }),
    contrasena: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] })
  });

  ingresando = false;
  error: string | null = null;
  /** La sesión anterior venció o el usuario fue desactivado (lo manda el interceptor). */
  readonly sesionTerminada: boolean;
  readonly usuariosPrueba: UsuarioPrueba[];
  private readonly volver: string | null;

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService,
    route: ActivatedRoute
  ) {
    const parametros = route.snapshot.queryParamMap;
    this.sesionTerminada = parametros.get('motivo') === 'sesion';
    this.volver = rutaInterna(parametros.get('volver'));
    this.usuariosPrueba = authService.usuariosPrueba();
  }

  ingresar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { correo, contrasena } = this.form.getRawValue();
    this.entrar(correo.trim().toLowerCase(), contrasena);
  }

  /** Solo desarrollo. */
  entrarComo(prueba: UsuarioPrueba): void {
    this.entrar(prueba.correo, prueba.contrasena);
  }

  private entrar(correo: string, contrasena: string): void {
    this.ingresando = true;
    this.error = null;
    this.authService.login(correo, contrasena).subscribe({
      next: () => this.router.navigateByUrl(this.volver ?? '/inicio'),
      error: (error: HttpErrorResponse) => {
        this.ingresando = false;
        this.error = ResponseHandlerUtil.describir(error).detalle;
        this.form.controls.contrasena.reset();
      }
    });
  }

}
