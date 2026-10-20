import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { CONTRASENA_MAXIMO, CONTRASENA_MINIMO, generarContrasena } from '../../../../core/utils/contrasena.util';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { ErrorCampoComponent } from '../../../../shared/components/error-campo/error-campo.component';
import { CustomValidators } from '../../../../shared/validators/custom-validators';
import { Usuario } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';

/**
 * El administrador asigna una contraseña nueva a un usuario (la anterior deja de servir). Al guardar se
 * muestra una sola vez para copiarla y entregarla.
 */
@Component({
  selector: 'app-usuario-contrasena-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, MessageModule, PasswordModule, ErrorCampoComponent],
  templateUrl: './usuario-contrasena-dialog.component.html',
  styleUrl: '../usuario-form-dialog/usuario-form-dialog.component.scss'
})
export class UsuarioContrasenaDialogComponent {

  @Input({ required: true }) usuario!: Usuario;
  @Output() done = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  readonly contrasenaMinimo = CONTRASENA_MINIMO;

  contrasenaForm: FormGroup;
  /** La contraseña ya guardada, para mostrarla una vez. */
  guardada: string | null = null;
  guardando = false;

  constructor(
    private formBuilder: FormBuilder,
    private usuarioService: UsuarioService,
    private messageService: MessageService
  ) {
    this.contrasenaForm = this.formBuilder.group({
      contrasena: ['', [Validators.required, Validators.minLength(CONTRASENA_MINIMO), Validators.maxLength(CONTRASENA_MAXIMO)]],
      confirmacion: ['', [Validators.required, CustomValidators.igualA('contrasena')]]
    });
    this.contrasenaForm.get('contrasena')?.valueChanges
      .subscribe(() => this.contrasenaForm.get('confirmacion')?.updateValueAndValidity({ emitEvent: false }));
  }

  generar(): void {
    const contrasena = generarContrasena();
    this.contrasenaForm.patchValue({ contrasena, confirmacion: contrasena });
  }

  copiar(): void {
    if (!this.guardada) {
      return;
    }
    navigator.clipboard.writeText(this.guardada).then(
      () => this.messageService.add({ severity: 'info', summary: 'Copiada', detail: 'La contraseña quedó en el portapapeles.' }),
      () => this.messageService.add({ severity: 'warn', summary: 'No se pudo copiar', detail: 'Cópiela a mano.' }));
  }

  guardar(): void {
    if (this.contrasenaForm.invalid) {
      this.contrasenaForm.markAllAsTouched();
      return;
    }
    const contrasena = this.contrasenaForm.getRawValue().contrasena;
    this.guardando = true;
    this.usuarioService.cambiarContrasena(this.usuario.id, contrasena).subscribe({
      next: response => {
        this.guardando = false;
        ResponseHandlerUtil.handleResponse(response, this.messageService);
        this.guardada = contrasena;
      },
      error: error => {
        this.guardando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

}
