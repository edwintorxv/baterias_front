import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { forkJoin, of } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { ErrorCampoComponent } from '../../../../shared/components/error-campo/error-campo.component';
import { PersonaCliente } from '../../../clientes/models/persona-cliente.model';
import { Evaluador } from '../../../evaluadores/models/evaluador.model';
import { EvaluadorService } from '../../../evaluadores/services/evaluador.service';
import { Aplicacion } from '../../models/aplicacion.model';
import { PREGUNTA_FILTRO } from '../../models/formulario-aplicacion.model';
import { AplicacionService } from '../../services/aplicacion.service';

/**
 * Aplicaciones de una persona en el cliente (su relación actual): abrirlas para digitar y crear una nueva
 * con su fecha, las preguntas filtro y, si se quiere, el evaluador. El grupo ocupacional lo pone el backend
 * según el tipo de cargo de la relación.
 */
@Component({
  selector: 'app-persona-aplicaciones-dialog',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, ButtonModule, DatePickerModule, SelectModule, SelectButtonModule,
    ErrorCampoComponent],
  templateUrl: './persona-aplicaciones-dialog.component.html',
  styleUrl: './persona-aplicaciones-dialog.component.scss'
})
export class PersonaAplicacionesDialogComponent implements OnInit {

  @Input({ required: true }) persona!: PersonaCliente;

  readonly siNo = [{ label: 'Sí', value: true }, { label: 'No', value: false }];
  readonly preguntaClientes = PREGUNTA_FILTRO.ATIENDE_CLIENTES.texto;
  readonly preguntaJefe = PREGUNTA_FILTRO.ES_JEFE.texto;
  readonly hoy = new Date();

  lstAplicaciones: Aplicacion[] = [];
  lstFirmantes: Evaluador[] = [];
  nuevaForm: FormGroup;
  creando = false;
  cargando = false;
  guardando = false;

  constructor(
    private formBuilder: FormBuilder,
    private aplicacionService: AplicacionService,
    private evaluadorService: EvaluadorService,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) {
    this.nuevaForm = this.formBuilder.group({
      fecha: [new Date() as Date | null, [Validators.required]],
      atiendeClientes: [null as boolean | null, [Validators.required]],
      esJefe: [null as boolean | null, [Validators.required]],
      fkEvaluador: [null as number | null]
    });
  }

  ngOnInit(): void {
    const idEvaluador = this.authService.usuario()?.idEvaluador;
    this.cargando = true;
    forkJoin({
      aplicaciones: this.aplicacionService.listarPorRelacion(this.persona.idRelacion),
      propio: idEvaluador ? this.evaluadorService.obtener(idEvaluador) : of(null)
    }).subscribe({
      next: ({ aplicaciones, propio }) => {
        this.cargando = false;
        this.lstAplicaciones = [...aplicaciones].sort((a, b) => (b.fechaAplicacion ?? '').localeCompare(a.fechaAplicacion ?? ''));
        // Solo puede firmar como él mismo (el backend responde 403 a otro).
        this.lstFirmantes = propio?.activo ? [propio] : [];
        this.creando = !aplicaciones.length && this.persona.activo;
      },
      error: error => {
        this.cargando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  abrir(aplicacion: Aplicacion): void {
    this.router.navigate(['/aplicaciones', aplicacion.id]);
  }

  crear(): void {
    if (this.nuevaForm.invalid) {
      this.nuevaForm.markAllAsTouched();
      return;
    }
    const valor = this.nuevaForm.getRawValue();
    this.guardando = true;
    this.aplicacionService.crear({
      fkEvaluadoCliente: this.persona.idRelacion,
      fkGrupoOcupacional: null,
      fechaAplicacion: this.fechaHora(valor.fecha),
      observaciones: null,
      recomendaciones: null,
      estado: null,
      atiendeClientes: valor.atiendeClientes,
      esJefe: valor.esJefe,
      fkEvaluador: valor.fkEvaluador
    }).subscribe({
      next: response => {
        this.guardando = false;
        ResponseHandlerUtil.handleResponse(response, this.messageService);
        this.router.navigate(['/aplicaciones', response.data.id]);
      },
      error: error => {
        this.guardando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  /** El día elegido con la hora actual, en hora local (yyyy-MM-ddTHH:mm:ss, sin cambiar de día por la zona). */
  private fechaHora(fecha: Date): string {
    const ahora = new Date();
    const dos = (n: number) => String(n).padStart(2, '0');
    return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`
      + `T${dos(ahora.getHours())}:${dos(ahora.getMinutes())}:${dos(ahora.getSeconds())}`;
  }

}
