import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { EnlaceContrasena } from '../../core/models/enlace-contrasena.model';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { CONTRASENA_MAXIMO, CONTRASENA_MINIMO } from '../../core/utils/contrasena.util';
import { ResponseHandlerUtil } from '../../core/utils/response-handler.util';
import { ErrorCampoComponent } from '../../shared/components/error-campo/error-campo.component';
import { CustomValidators } from '../../shared/validators/custom-validators';

/**
 * Página pública del enlace que llega por correo (/definir-contrasena?codigo=): invitación de un usuario nuevo o
 * contraseña olvidada. Si el enlace no sirve (vencido, usado, reemplazado por otro o inválido) muestra el mensaje
 * del backend, que remite al administrador por teléfono: el sistema no ofrece pedir otro. Al definirla, cierra la
 * sesión que hubiera en este navegador y lleva al inicio de sesión con el correo ya escrito.
 */
@Component({
  selector: 'app-definir-contrasena',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, ButtonModule, MessageModule, PasswordModule, ProgressSpinnerModule,
    ErrorCampoComponent],
  templateUrl: './definir-contrasena.component.html',
  styleUrl: '../login/login.component.scss'
})
export class DefinirContrasenaComponent implements OnInit {

  readonly contrasenaMinimo = CONTRASENA_MINIMO;

  form = new FormGroup({
    contrasena: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(CONTRASENA_MINIMO), Validators.maxLength(CONTRASENA_MAXIMO)]
    }),
    confirmacion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, CustomValidators.igualA('contrasena')]
    })
  });

  cargando = true;
  guardando = false;
  enlace: EnlaceContrasena | null = null;
  /** Mensaje que impide seguir: enlace no vigente, o vencido/usado mientras la página estaba abierta (409). */
  bloqueo: string | null = null;
  error: string | null = null;
  private readonly codigo: string;

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService,
    route: ActivatedRoute
  ) {
    this.codigo = route.snapshot.queryParamMap.get('codigo')?.trim() ?? '';
    this.form.controls.contrasena.valueChanges
      .subscribe(() => this.form.controls.confirmacion.updateValueAndValidity({ emitEvent: false }));
  }

  get invitacion(): boolean {
    return this.enlace?.proposito === 'INVITACION';
  }

  ngOnInit(): void {
    if (!this.codigo) {
      this.cargando = false;
      this.bloqueo = 'El enlace no es válido. Comuníquese por teléfono con el administrador.';
      return;
    }
    this.authService.consultarEnlace(this.codigo).subscribe({
      next: enlace => {
        this.cargando = false;
        this.enlace = enlace;
        this.bloqueo = enlace.vigente ? null : enlace.mensaje;
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        this.bloqueo = ResponseHandlerUtil.describir(error).detalle;
      }
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando = true;
    this.error = null;
    this.authService.definirContrasena(this.codigo, this.form.controls.contrasena.value).subscribe({
      next: correo => {
        // Una sesión de otra persona en este navegador no debe quedar abierta.
        this.authService.logout();
        this.router.navigate(['/login'], { queryParams: { motivo: 'contrasena', correo } });
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        const detalle = ResponseHandlerUtil.describir(error).detalle;
        if (error.status === 409) {
          this.bloqueo = detalle;
        } else {
          this.error = detalle;
        }
      }
    });
  }

}
