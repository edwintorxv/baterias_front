import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { NOMBRE_ROL, Rol } from '../../../../core/models/sesion.model';
import { CONTRASENA_MAXIMO, CONTRASENA_MINIMO, generarContrasena } from '../../../../core/utils/contrasena.util';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { ErrorCampoComponent } from '../../../../shared/components/error-campo/error-campo.component';
import { CustomValidators } from '../../../../shared/validators/custom-validators';
import { Cliente } from '../../../clientes/models/cliente.model';
import { Evaluador } from '../../../evaluadores/models/evaluador.model';
import { ROLES_CREABLES, Usuario, UsuarioRequest } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';

/** Control del vínculo que exige cada rol (ADMIN no tiene). */
const VINCULO: Record<Rol, 'idEvaluador' | 'idCliente' | 'idEvaluado' | null> = {
  ADMIN: null,
  PSICOLOGO: 'idEvaluador',
  CLIENTE: 'idCliente',
  EVALUADO: 'idEvaluado'
};

/**
 * Crear o editar un usuario (solo ADMIN). El vínculo cambia con el rol: evaluador activo sin usuario
 * (PSICOLOGO) o empresa (CLIENTE). EVALUADO no se crea desde aquí (queda para responder en línea); los que
 * existan se editan sin cambiar la persona. Nadie se cambia el rol ni se inactiva a sí mismo (el backend
 * también lo exige, junto con que quede al menos un ADMIN activo).
 */
@Component({
  selector: 'app-usuario-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, MessageModule, PasswordModule, SelectModule,
    ToggleSwitchModule, ErrorCampoComponent],
  templateUrl: './usuario-form-dialog.component.html',
  styleUrl: './usuario-form-dialog.component.scss'
})
export class UsuarioFormDialogComponent implements OnInit {

  @Input() usuario?: Usuario;
  /** Todos los usuarios: para saber qué evaluadores ya tienen uno. */
  @Input({ required: true }) usuarios: Usuario[] = [];
  @Input({ required: true }) evaluadores: Evaluador[] = [];
  @Input({ required: true }) clientes: Cliente[] = [];
  /** El usuario de la sesión: no se cambia el rol ni se inactiva a sí mismo. */
  @Input() idUsuarioSesion: number | null = null;
  /** Clientes asignados del psicólogo que se edita, para avisar si los pierde. */
  @Input() clientesAsignados: number | null = null;
  @Output() saved = new EventEmitter<Usuario>();
  @Output() cancel = new EventEmitter<void>();

  readonly contrasenaMinimo = CONTRASENA_MINIMO;

  usuarioForm: FormGroup;
  lstRoles: { label: string; value: Rol }[] = [];
  lstEvaluadores: Evaluador[] = [];
  contrasenaGenerada: string | null = null;
  guardando = false;

  constructor(
    private formBuilder: FormBuilder,
    private usuarioService: UsuarioService,
    private messageService: MessageService
  ) {
    // Los largos máximos son los del backend (UsuarioCrearRequest / UsuarioRequest).
    this.usuarioForm = this.formBuilder.group({
      correo: ['', [Validators.required, Validators.maxLength(100), CustomValidators.correoElectronico]],
      nombre: ['', [Validators.required, Validators.maxLength(200), CustomValidators.texto]],
      rol: [null as Rol | null, [Validators.required]],
      idEvaluador: [null as number | null],
      idCliente: [null as number | null],
      idEvaluado: [null as number | null],
      contrasena: [''],
      confirmacion: [''],
      activo: [true]
    });
  }

  get isEditMode(): boolean {
    return !!this.usuario;
  }

  get esYo(): boolean {
    return !!this.usuario && this.usuario.id === this.idUsuarioSesion;
  }

  get rol(): Rol | null {
    return this.usuarioForm.get('rol')?.value ?? null;
  }

  /** Psicólogo que deja de serlo: pierde sus clientes asignados. */
  get pierdeClientes(): boolean {
    return this.usuario?.rol === 'PSICOLOGO' && this.rol !== 'PSICOLOGO' && !!this.clientesAsignados;
  }

  get inactivando(): boolean {
    return !!this.usuario?.activo && !this.usuarioForm.get('activo')?.value;
  }

  ngOnInit(): void {
    const roles = this.usuario?.rol === 'EVALUADO' ? [...ROLES_CREABLES, 'EVALUADO' as Rol] : ROLES_CREABLES;
    this.lstRoles = roles.map(rol => ({ label: NOMBRE_ROL[rol], value: rol }));
    this.lstEvaluadores = this.evaluadoresDisponibles();

    if (this.usuario) {
      this.usuarioForm.patchValue({
        correo: this.usuario.correo,
        nombre: this.usuario.nombre,
        rol: this.usuario.rol,
        idEvaluador: this.usuario.idEvaluador,
        idCliente: this.usuario.idCliente,
        idEvaluado: this.usuario.idEvaluado,
        activo: this.usuario.activo
      });
      // El rol EVALUADO no se cambia aquí: la persona vinculada no la puede elegir el administrador.
      if (this.esYo || this.usuario.rol === 'EVALUADO') {
        this.usuarioForm.get('rol')?.disable();
      }
      if (this.esYo) {
        this.usuarioForm.get('activo')?.disable();
      }
    } else {
      const contrasena: ValidatorFn[] = [Validators.required, Validators.minLength(CONTRASENA_MINIMO),
        Validators.maxLength(CONTRASENA_MAXIMO)];
      this.usuarioForm.get('contrasena')?.setValidators(contrasena);
      this.usuarioForm.get('confirmacion')?.setValidators([Validators.required, CustomValidators.igualA('contrasena')]);
      this.usuarioForm.get('contrasena')?.valueChanges
        .subscribe(() => this.usuarioForm.get('confirmacion')?.updateValueAndValidity({ emitEvent: false }));
    }
    this.aplicarVinculo(this.rol);
  }

  /** Al cambiar el rol se exige su vínculo y se borran los que no aplican. */
  onRolChange(rol: Rol | null): void {
    this.aplicarVinculo(rol);
    const requerido = rol ? VINCULO[rol] : null;
    (['idEvaluador', 'idCliente'] as const)
      .filter(campo => campo !== requerido)
      .forEach(campo => this.usuarioForm.get(campo)?.setValue(null));
  }

  generar(): void {
    const contrasena = generarContrasena();
    this.contrasenaGenerada = contrasena;
    this.usuarioForm.patchValue({ contrasena, confirmacion: contrasena });
    this.usuarioForm.get('contrasena')?.markAsDirty();
  }

  copiar(texto: string): void {
    navigator.clipboard.writeText(texto).then(
      () => this.messageService.add({ severity: 'info', summary: 'Copiada', detail: 'La contraseña quedó en el portapapeles.' }),
      () => this.messageService.add({ severity: 'warn', summary: 'No se pudo copiar', detail: 'Cópiela a mano.' }));
  }

  guardar(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const request = this.toRequest();
    const valor = this.usuarioForm.getRawValue();
    const peticion = this.usuario
      ? this.usuarioService.actualizar(this.usuario.id, request)
      : this.usuarioService.crear({ ...request, contrasena: valor.contrasena });

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

  private aplicarVinculo(rol: Rol | null): void {
    const requerido = rol ? VINCULO[rol] : null;
    (['idEvaluador', 'idCliente'] as const).forEach(campo => {
      const control = this.usuarioForm.get(campo);
      control?.setValidators(campo === requerido ? [Validators.required] : []);
      control?.updateValueAndValidity({ emitEvent: false });
    });
  }

  /** Activos sin usuario, más el que ya tiene este usuario (aunque se haya inactivado). */
  private evaluadoresDisponibles(): Evaluador[] {
    const ocupados = new Set(this.usuarios
      .filter(u => u.idEvaluador !== null && u.id !== this.usuario?.id)
      .map(u => u.idEvaluador));
    return this.evaluadores
      .filter(e => e.id === this.usuario?.idEvaluador || (e.activo && !ocupados.has(e.id)))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  /** Recorta espacios y manda solo el vínculo del rol. */
  private toRequest(): UsuarioRequest {
    const valor = this.usuarioForm.getRawValue();
    const rol = valor.rol as Rol;
    return {
      correo: valor.correo.trim().toLowerCase(),
      nombre: valor.nombre.trim(),
      rol,
      idEvaluador: rol === 'PSICOLOGO' ? valor.idEvaluador : null,
      idCliente: rol === 'CLIENTE' ? valor.idCliente : null,
      idEvaluado: rol === 'EVALUADO' ? valor.idEvaluado : null,
      activo: this.isEditMode ? valor.activo : null
    };
  }

}
