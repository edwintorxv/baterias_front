import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { ErrorCampoComponent } from '../../../../shared/components/error-campo/error-campo.component';
import { CustomValidators } from '../../../../shared/validators/custom-validators';
import { Evaluador, EvaluadorRequest } from '../../models/evaluador.model';
import { EvaluadorService } from '../../services/evaluador.service';

/**
 * Crear o editar un evaluador (solo ADMIN): datos profesionales que salen en los informes y estado.
 * Inactivo = no se le asignan aplicaciones ni informes nuevos; lo que ya firmó lo conserva.
 * La firma tiene su propio diálogo.
 */
@Component({
  selector: 'app-evaluador-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, DatePickerModule, InputTextModule, MessageModule, ToggleSwitchModule,
    ErrorCampoComponent],
  templateUrl: './evaluador-form-dialog.component.html',
  styleUrl: './evaluador-form-dialog.component.scss'
})
export class EvaluadorFormDialogComponent implements OnInit {

  @Input() evaluador?: Evaluador;
  @Output() saved = new EventEmitter<Evaluador>();
  @Output() cancel = new EventEmitter<void>();

  readonly hoy = new Date();

  evaluadorForm: FormGroup;
  guardando = false;

  constructor(
    private formBuilder: FormBuilder,
    private evaluadorService: EvaluadorService,
    private messageService: MessageService
  ) {
    // Los largos máximos son los del backend (EvaluadorRequest).
    this.evaluadorForm = this.formBuilder.group({
      numeroIdentificacion: ['', [Validators.required, Validators.maxLength(30), CustomValidators.documento]],
      nombre: ['', [Validators.required, Validators.maxLength(200), CustomValidators.soloLetras]],
      profesion: ['', [Validators.required, Validators.maxLength(200), CustomValidators.texto]],
      posgrado: ['', [Validators.maxLength(200), CustomValidators.texto]],
      tarjetaProfesional: ['', [Validators.required, Validators.maxLength(50), CustomValidators.texto]],
      licenciaSaludOcupacional: ['', [Validators.required, Validators.maxLength(50), CustomValidators.texto]],
      fechaExpedicionLicencia: [null as Date | null, [Validators.required]],
      activo: [true]
    });
  }

  get isEditMode(): boolean {
    return !!this.evaluador;
  }

  /** Para avisar qué pasa al inactivar a quien hoy está activo. */
  get inactivando(): boolean {
    return !!this.evaluador?.activo && !this.evaluadorForm.get('activo')?.value;
  }

  ngOnInit(): void {
    if (this.evaluador) {
      const [anio, mes, dia] = (this.evaluador.fechaExpedicionLicencia ?? '').split('-').map(Number);
      this.evaluadorForm.patchValue({
        numeroIdentificacion: this.evaluador.numeroIdentificacion,
        nombre: this.evaluador.nombre,
        profesion: this.evaluador.profesion ?? '',
        posgrado: this.evaluador.posgrado ?? '',
        tarjetaProfesional: this.evaluador.tarjetaProfesional ?? '',
        licenciaSaludOcupacional: this.evaluador.licenciaSaludOcupacional ?? '',
        fechaExpedicionLicencia: anio ? new Date(anio, mes - 1, dia) : null,
        activo: this.evaluador.activo
      });
    }
  }

  guardar(): void {
    if (this.evaluadorForm.invalid) {
      this.evaluadorForm.markAllAsTouched();
      return;
    }

    const request = this.toRequest();
    const peticion = this.evaluador
      ? this.evaluadorService.actualizar(this.evaluador.id, request)
      : this.evaluadorService.crear(request);

    this.guardando = true;
    peticion.subscribe({
      next: response => {
        this.guardando = false;
        ResponseHandlerUtil.handleResponse(response, this.messageService);
        this.saved.emit(response.data);
      },
      error: error => {
        this.guardando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  /** Recorta espacios, manda null en vez de texto vacío y la fecha como yyyy-MM-dd (sin cambiar de día por la zona). */
  private toRequest(): EvaluadorRequest {
    const valor = this.evaluadorForm.getRawValue();
    const fecha = valor.fechaExpedicionLicencia as Date;
    return {
      numeroIdentificacion: valor.numeroIdentificacion.trim(),
      nombre: valor.nombre.trim(),
      profesion: valor.profesion.trim(),
      posgrado: valor.posgrado?.trim() || null,
      tarjetaProfesional: valor.tarjetaProfesional.trim(),
      licenciaSaludOcupacional: valor.licenciaSaludOcupacional.trim(),
      fechaExpedicionLicencia:
        `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`,
      activo: valor.activo
    };
  }

}
