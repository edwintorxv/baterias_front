import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { ErrorCampoComponent } from '../../../../shared/components/error-campo/error-campo.component';
import { PersonaCliente } from '../../../clientes/models/persona-cliente.model';
import { Evaluador } from '../../../evaluadores/models/evaluador.model';
import { EvaluadorService } from '../../../evaluadores/services/evaluador.service';
import { Aplicacion } from '../../models/aplicacion.model';
import { FORMA_GRUPO, PREGUNTA_FILTRO } from '../../models/formulario-aplicacion.model';
import { AplicacionService } from '../../services/aplicacion.service';

/**
 * Aplicaciones de una persona en el cliente (su relación actual): abrirlas para digitar y crear una nueva
 * con su fecha, la forma que responde, las preguntas filtro y, si se quiere, el evaluador. La forma la elige el
 * psicólogo con la descripción del manual (se avisa si no coincide con el tipo de cargo registrado, sin bloquear);
 * "¿es jefe?" solo se pregunta en la forma A.
 */
@Component({
  selector: 'app-persona-aplicaciones-dialog',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, ButtonModule, DatePickerModule, MessageModule, SelectModule, SelectButtonModule,
    ErrorCampoComponent],
  templateUrl: './persona-aplicaciones-dialog.component.html',
  styleUrl: './persona-aplicaciones-dialog.component.scss'
})
export class PersonaAplicacionesDialogComponent implements OnInit {

  @Input({ required: true }) persona!: PersonaCliente;

  readonly siNo = [{ label: 'Sí', value: true }, { label: 'No', value: false }];
  readonly preguntaClientes = PREGUNTA_FILTRO.ATIENDE_CLIENTES.texto;
  readonly preguntaJefe = PREGUNTA_FILTRO.ES_JEFE.texto;
  readonly formas = FORMA_GRUPO;
  readonly hoy = new Date();

  lstAplicaciones: Aplicacion[] = [];
  lstFirmantes: Evaluador[] = [];
  nuevaForm: FormGroup;
  /** Grupo ocupacional del tipo de cargo registrado en la relación (null si no tiene o no se encontró). */
  grupoRegistrado: number | null = null;
  creando = false;
  cargando = false;
  guardando = false;

  constructor(
    private formBuilder: FormBuilder,
    private aplicacionService: AplicacionService,
    private evaluadorService: EvaluadorService,
    private catalogoService: CatalogoService,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) {
    this.nuevaForm = this.formBuilder.group({
      fecha: [new Date() as Date | null, [Validators.required]],
      fkGrupoOcupacional: [null as number | null, [Validators.required]],
      atiendeClientes: [null as boolean | null, [Validators.required]],
      esJefe: [null as boolean | null],
      fkEvaluador: [null as number | null]
    });
    // "¿Es jefe?" solo cuenta en la forma A: en la B no se pide y se envía vacía.
    this.nuevaForm.get('fkGrupoOcupacional')!.valueChanges.subscribe(grupo => {
      const esJefe = this.nuevaForm.get('esJefe')!;
      esJefe.setValidators(grupo === 1 ? [Validators.required] : []);
      if (grupo !== 1) {
        esJefe.reset(null);
      }
      esJefe.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    const idEvaluador = this.authService.usuario()?.idEvaluador;
    this.cargando = true;
    forkJoin({
      aplicaciones: this.aplicacionService.listarPorRelacion(this.persona.idRelacion),
      propio: idEvaluador ? this.evaluadorService.obtener(idEvaluador) : of(null),
      // Solo para el aviso: si falla, el diálogo sigue sin él.
      tiposCargo: this.catalogoService.tiposCargo().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ aplicaciones, propio, tiposCargo }) => {
        this.cargando = false;
        this.lstAplicaciones = [...aplicaciones].sort((a, b) => (b.fechaAplicacion ?? '').localeCompare(a.fechaAplicacion ?? ''));
        // Solo puede firmar como él mismo (el backend responde 403 a otro).
        this.lstFirmantes = propio?.activo ? [propio] : [];
        this.grupoRegistrado = tiposCargo.find(t => t.nombre === this.persona.tipoCargo)?.fkGrupoOcupacional ?? null;
        this.creando = !aplicaciones.length && this.persona.activo;
      },
      error: error => {
        this.cargando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  get grupoElegido(): number | null {
    return this.nuevaForm.get('fkGrupoOcupacional')!.value;
  }

  /** La forma elegida no es la que corresponde al tipo de cargo registrado: se avisa, no se bloquea. */
  get formaNoCoincide(): boolean {
    return this.grupoElegido != null && this.grupoRegistrado != null && this.grupoElegido !== this.grupoRegistrado;
  }

  forma(grupo: number | null): string {
    return this.formas.find(f => f.id === grupo)?.forma ?? '';
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
      fkGrupoOcupacional: valor.fkGrupoOcupacional,
      fechaAplicacion: this.fechaHora(valor.fecha),
      observaciones: null,
      recomendaciones: null,
      estado: null,
      atiendeClientes: valor.atiendeClientes,
      esJefe: valor.fkGrupoOcupacional === 1 ? valor.esJefe : null,
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
