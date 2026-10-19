import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Observable, forkJoin, of } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { Evaluador } from '../../../evaluadores/models/evaluador.model';
import { EvaluadorService } from '../../../evaluadores/services/evaluador.service';
import { ConclusionesInforme, ConclusionesInformeRequest, ProfesionalInforme } from '../../models/informe-empresa.model';
import { InformeEmpresaService } from '../../services/informe-empresa.service';

interface OpcionFirmante {
  id: number;
  nombre: string;
}

/**
 * Conclusiones, plan de acción (corto, mediano y largo plazo) y profesional responsable del informe de
 * un año. Las escribe el psicólogo; el cliente las ve en solo lectura.
 * Firmante: vacío, el propio psicólogo (si está activo) o el que ya tenía el informe (el backend responde
 * 403 a cualquier otro).
 */
@Component({
  selector: 'app-informe-conclusiones',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, ButtonModule, SelectModule, TextareaModule],
  templateUrl: './informe-conclusiones.component.html',
  styleUrl: './informe-conclusiones.component.scss'
})
export class InformeConclusionesComponent implements OnChanges {

  @Input({ required: true }) idCliente!: number;
  @Input({ required: true }) anio!: number;
  @Input() soloLectura = false;
  /** El profesional que ya tiene el informe (viene en el JSON del informe, con su nombre). */
  @Input() profesionalActual: ProfesionalInforme | null = null;
  @Output() saved = new EventEmitter<ConclusionesInforme>();

  readonly campos = [
    { control: 'accionesCortoPlazo', etiqueta: 'Acciones a corto plazo' },
    { control: 'accionesMedianoPlazo', etiqueta: 'Acciones a mediano plazo' },
    { control: 'accionesLargoPlazo', etiqueta: 'Acciones a largo plazo' }
  ];

  conclusionesForm: FormGroup;
  guardado?: ConclusionesInforme;
  lstFirmantes: OpcionFirmante[] = [];
  cargando = false;
  guardando = false;

  constructor(
    private formBuilder: FormBuilder,
    private informeEmpresaService: InformeEmpresaService,
    private evaluadorService: EvaluadorService,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    // Sin largo máximo: en la BD son TEXT.
    this.conclusionesForm = this.formBuilder.group({
      conclusiones: [''],
      accionesCortoPlazo: [''],
      accionesMedianoPlazo: [''],
      accionesLargoPlazo: [''],
      fkEvaluador: [null as number | null]
    });
  }

  /** Cambiar de año (o de cliente) vuelve a cargar lo guardado. */
  ngOnChanges(): void {
    this.cargar();
  }

  cargar(): void {
    const idEvaluador = this.authService.usuario()?.idEvaluador;
    const propio: Observable<Evaluador | null> = !this.soloLectura && idEvaluador
      ? this.evaluadorService.obtener(idEvaluador)
      : of(null);

    this.cargando = true;
    forkJoin({
      conclusiones: this.informeEmpresaService.conclusiones(this.idCliente, this.anio),
      propio
    }).subscribe({
      next: ({ conclusiones, propio }) => {
        this.cargando = false;
        this.guardado = conclusiones;
        this.lstFirmantes = this.firmantes(propio);
        this.conclusionesForm.reset({
          conclusiones: conclusiones.conclusiones ?? '',
          accionesCortoPlazo: conclusiones.accionesCortoPlazo ?? '',
          accionesMedianoPlazo: conclusiones.accionesMedianoPlazo ?? '',
          accionesLargoPlazo: conclusiones.accionesLargoPlazo ?? '',
          fkEvaluador: conclusiones.fkEvaluador
        });
        if (this.soloLectura) {
          this.conclusionesForm.disable();
        }
      },
      error: error => {
        this.cargando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  guardar(): void {
    this.guardando = true;
    this.informeEmpresaService.guardarConclusiones(this.idCliente, this.anio, this.toRequest()).subscribe({
      next: response => {
        this.guardando = false;
        this.guardado = response.data;
        this.conclusionesForm.markAsPristine();
        ResponseHandlerUtil.handleResponse(response, this.messageService);
        this.saved.emit(response.data);
      },
      error: error => {
        this.guardando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  /** El propio (si está activo) y el que ya tenía el informe, sin repetir. */
  private firmantes(propio: Evaluador | null): OpcionFirmante[] {
    const opciones: OpcionFirmante[] = [];
    if (propio?.activo) {
      opciones.push({ id: propio.id, nombre: propio.nombre });
    }
    const actual = this.profesionalActual;
    if (actual && actual.id !== propio?.id) {
      opciones.push({ id: actual.id, nombre: actual.nombre });
    }
    return opciones;
  }

  /** Recorta espacios y manda null en vez de texto vacío. */
  private toRequest(): ConclusionesInformeRequest {
    const valor = this.conclusionesForm.getRawValue();
    const texto = (v: string | null) => v?.trim() || null;
    return {
      conclusiones: texto(valor.conclusiones),
      accionesCortoPlazo: texto(valor.accionesCortoPlazo),
      accionesMedianoPlazo: texto(valor.accionesMedianoPlazo),
      accionesLargoPlazo: texto(valor.accionesLargoPlazo),
      fkEvaluador: valor.fkEvaluador
    };
  }

}
