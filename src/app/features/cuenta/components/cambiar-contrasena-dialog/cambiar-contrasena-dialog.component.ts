import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../../core/services/auth.service';
import { CONTRASENA_MAXIMO, CONTRASENA_MINIMO } from '../../../../core/utils/contrasena.util';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { ErrorCampoComponent } from '../../../../shared/components/error-campo/error-campo.component';
import { CustomValidators } from '../../../../shared/validators/custom-validators';

/**
 * Cambiar la propia contraseña (todos los roles, desde el menú del nombre). Al guardar, el backend cierra las
 * sesiones de los demás equipos, avisa por correo y devuelve un token nuevo, que AuthService guarda: esta sesión
 * sigue abierta. Los errores (actual incorrecta, nueva igual, demasiados intentos) se muestran en el diálogo.
 */
@Component({
  selector: 'app-cambiar-contrasena-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, MessageModule, PasswordModule, ErrorCampoComponent],
  templateUrl: './cambiar-contrasena-dialog.component.html',
  styleUrl: './cambiar-contrasena-dialog.component.scss'
})
export class CambiarContrasenaDialogComponent {

  @Output() done = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  readonly contrasenaMinimo = CONTRASENA_MINIMO;

  form = new FormGroup({
    actual: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(CONTRASENA_MAXIMO)]
    }),
    nueva: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(CONTRASENA_MINIMO), Validators.maxLength(CONTRASENA_MAXIMO)]
    }),
    confirmacion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, CustomValidators.igualA('nueva')]
    })
  });

  guardando = false;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.form.controls.nueva.valueChanges
      .subscribe(() => this.form.controls.confirmacion.updateValueAndValidity({ emitEvent: false }));
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { actual, nueva } = this.form.getRawValue();
    this.guardando = true;
    this.error = null;
    this.authService.cambiarContrasena(actual, nueva).subscribe({
      next: mensaje => {
        this.guardando = false;
        this.messageService.add({ severity: 'success', summary: 'Contraseña actualizada', detail: mensaje, life: 5000 });
        this.done.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.error = ResponseHandlerUtil.describir(error).detalle;
        this.form.controls.actual.reset();
      }
    });
  }

}
