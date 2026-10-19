import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Observable, forkJoin, of, switchMap } from 'rxjs';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { ErrorCampoComponent } from '../../../../shared/components/error-campo/error-campo.component';
import { Catalogo } from '../../../../shared/models/catalogo.model';
import { CiudadMunicipio } from '../../../../shared/models/ciudad-municipio.model';
import { Departamento } from '../../../../shared/models/departamento.model';
import { CustomValidators } from '../../../../shared/validators/custom-validators';
import { EvaluadoCliente, EvaluadoClienteRequest } from '../../../evaluados/models/evaluado-cliente.model';
import { Evaluado, EvaluadoRequest } from '../../../evaluados/models/evaluado.model';
import { EvaluadoClienteService } from '../../../evaluados/services/evaluado-cliente.service';
import { EvaluadoService } from '../../../evaluados/services/evaluado.service';
import { EDAD_MAXIMA, EDAD_MINIMA, VincularPersonaRequest } from '../../models/vincular-persona.model';
import { ClienteService } from '../../services/cliente.service';

/**
 * Vincular una persona al cliente (solo PSICOLOGO). No busca ni prellena por documento: siempre se
 * recapturan los datos, y el backend decide si es nueva, ya existía, ya estaba en el cliente o cambia de
 * empresa (el mensaje lo dice).
 * Con {@code edicion}: edita una relación activa (PUT /evaluado-clientes/{id}); el documento no se cambia y
 * si se corrigen nombre, apellido, sexo o año se guardan también en la persona (PUT /evaluados/{id}).
 * Se crea de nuevo cada vez que se abre el diálogo.
 */
@Component({
  selector: 'app-vincular-persona-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    SelectModule,
    ErrorCampoComponent
  ],
  templateUrl: './vincular-persona-dialog.component.html',
  styleUrl: './vincular-persona-dialog.component.scss'
})
export class VincularPersonaDialogComponent implements OnInit {

  @Input({ required: true }) idCliente!: number;
  /** Relación a editar; sin ella, se vincula una persona nueva. */
  @Input() edicion?: { idRelacion: number; idEvaluado: number };
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  readonly anioMinimo: number;
  readonly anioMaximo: number;

  personaForm: FormGroup;

  lstSexos: Catalogo[] = [];
  lstEstadosCiviles: Catalogo[] = [];
  lstNivelesAcademicos: Catalogo[] = [];
  lstEstratos: Catalogo[] = [];
  lstTiposVivienda: Catalogo[] = [];
  lstTiposCargo: Catalogo[] = [];
  lstTiemposCargo: Catalogo[] = [];
  lstTiposContrato: Catalogo[] = [];
  lstHorasLabor: Catalogo[] = [];
  lstTiposSalario: Catalogo[] = [];
  lstDepartamentos: Departamento[] = [];
  lstCiudadesResidencia: CiudadMunicipio[] = [];
  lstCiudadesTrabajo: CiudadMunicipio[] = [];
  private todasLasCiudades: CiudadMunicipio[] = [];

  guardando = false;
  cargando = false;
  /** Lo que tenía guardado, al editar. */
  private evaluado?: Evaluado;
  private relacion?: EvaluadoCliente;

  constructor(
    private formBuilder: FormBuilder,
    private catalogoService: CatalogoService,
    private clienteService: ClienteService,
    private evaluadoService: EvaluadoService,
    private evaluadoClienteService: EvaluadoClienteService,
    private messageService: MessageService
  ) {
    const anioActual = new Date().getFullYear();
    this.anioMinimo = anioActual - EDAD_MAXIMA;
    this.anioMaximo = anioActual - EDAD_MINIMA;

    // Los largos máximos y las reglas son las del backend (VincularPersonaRequest).
    this.personaForm = this.formBuilder.group({
      numeroIdentificacion: ['', [Validators.required, Validators.maxLength(30), CustomValidators.documento]],
      nombre: ['', [Validators.required, Validators.maxLength(150), CustomValidators.soloLetras]],
      apellido: ['', [Validators.required, Validators.maxLength(150), CustomValidators.soloLetras]],
      fkSexo: [null as number | null, [Validators.required]],
      anioNacimiento: ['', [Validators.required, CustomValidators.soloNumeros,
        Validators.min(this.anioMinimo), Validators.max(this.anioMaximo)]],

      fkEstadoCivil: [null as number | null],
      fkNivelAcademico: [null as number | null, [Validators.required]],
      departamentoResidencia: [null as number | null],
      fkCiudadResidencia: [null as number | null],
      fkEstratoSocioeconomico: [null as number | null],
      fkTipoVivienda: [null as number | null],
      ocupacionProfesion: ['', [Validators.maxLength(200), CustomValidators.texto]],
      familiaresDependientesEconomicamente: ['', [CustomValidators.soloNumeros, Validators.min(0), Validators.max(30)]],

      departamentoTrabajo: [null as number | null],
      fkCiudadTrabajo: [null as number | null],
      nombreCargo: ['', [Validators.maxLength(200), CustomValidators.texto]],
      fkTipoCargo: [null as number | null, [Validators.required]],
      nombreArea: ['', [Validators.maxLength(200), CustomValidators.texto]],
      antiguedadEmpresa: ['', [Validators.maxLength(100), CustomValidators.texto]],
      fkTiempoCargo: [null as number | null],
      fkTipoContrato: [null as number | null],
      fkHorasLabor: [null as number | null],
      fkTipoSalario: [null as number | null],
      fechaVinculacion: [new Date() as Date | null]
    });
  }

  get isEditMode(): boolean {
    return !!this.edicion;
  }

  ngOnInit(): void {
    const actual: Observable<{ evaluado: Evaluado; relacion: EvaluadoCliente } | null> = this.edicion
      ? forkJoin({
        evaluado: this.evaluadoService.obtener(this.edicion.idEvaluado),
        relacion: this.evaluadoClienteService.obtener(this.edicion.idRelacion)
      })
      : of(null);
    this.cargando = true;
    forkJoin({
      actual,
      sexos: this.catalogoService.sexos(),
      estadosCiviles: this.catalogoService.estadosCiviles(),
      nivelesAcademicos: this.catalogoService.nivelesAcademicos(),
      estratos: this.catalogoService.estratos(),
      tiposVivienda: this.catalogoService.tiposVivienda(),
      tiposCargo: this.catalogoService.tiposCargo(),
      tiemposCargo: this.catalogoService.tiemposCargo(),
      tiposContrato: this.catalogoService.tiposContrato(),
      horasLabor: this.catalogoService.horasLabor(),
      tiposSalario: this.catalogoService.tiposSalario(),
      departamentos: this.catalogoService.departamentos(),
      ciudades: this.catalogoService.ciudades()
    }).subscribe({
      next: catalogos => {
        this.lstSexos = catalogos.sexos;
        this.lstEstadosCiviles = catalogos.estadosCiviles;
        this.lstNivelesAcademicos = catalogos.nivelesAcademicos;
        this.lstEstratos = catalogos.estratos;
        this.lstTiposVivienda = catalogos.tiposVivienda;
        this.lstTiposCargo = catalogos.tiposCargo;
        this.lstTiemposCargo = catalogos.tiemposCargo;
        this.lstTiposContrato = catalogos.tiposContrato;
        this.lstHorasLabor = catalogos.horasLabor;
        this.lstTiposSalario = catalogos.tiposSalario;
        this.lstDepartamentos = catalogos.departamentos;
        this.todasLasCiudades = catalogos.ciudades;
        if (catalogos.actual) {
          this.setFormForEdit(catalogos.actual.evaluado, catalogos.actual.relacion);
        }
        this.cargando = false;
      },
      error: error => {
        this.cargando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  /** Al cambiar el departamento se filtran sus ciudades y se borra la que estaba elegida. */
  onDepartamentoResidenciaChange(idDepartamento: number | null): void {
    this.lstCiudadesResidencia = this.ciudadesDe(idDepartamento);
    this.personaForm.patchValue({ fkCiudadResidencia: null });
  }

  onDepartamentoTrabajoChange(idDepartamento: number | null): void {
    this.lstCiudadesTrabajo = this.ciudadesDe(idDepartamento);
    this.personaForm.patchValue({ fkCiudadTrabajo: null });
  }

  vincular(): void {
    if (this.personaForm.invalid) {
      this.personaForm.markAllAsTouched();
      return;
    }
    const peticion: Observable<{ message: string }> = this.edicion ? this.guardarEdicion() : this.clienteService
      .vincularPersona(this.idCliente, this.toRequest());
    this.guardando = true;
    peticion.subscribe({
      next: response => {
        this.guardando = false;
        this.messageService.add({ severity: 'success', summary: 'Listo', detail: response.message, life: 4000 });
        this.saved.emit();
      },
      error: error => {
        this.guardando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  /**
   * Primero la relación (es la que puede fallar por fechas) y después, solo si cambió, la persona.
   * La relación sigue activa: editar no inactiva (para eso está la acción Inactivar).
   */
  private guardarEdicion(): Observable<{ message: string }> {
    const datos = this.toRequest();
    const { numeroIdentificacion, nombre, apellido, fkSexo, anioNacimiento, ...foto } = datos;
    const relacion: EvaluadoClienteRequest = {
      ...foto,
      fkEvaluado: this.relacion!.fkEvaluado,
      fkCliente: this.relacion!.fkCliente,
      fechaRetiro: null,
      activo: true
    };
    const persona: EvaluadoRequest = {
      numeroIdentificacion: this.evaluado!.numeroIdentificacion,
      nombre,
      apellido,
      fkSexo,
      anioNacimiento
    };
    const personaCambio = persona.nombre !== this.evaluado!.nombre || persona.apellido !== this.evaluado!.apellido
      || persona.fkSexo !== this.evaluado!.fkSexo || persona.anioNacimiento !== this.evaluado!.anioNacimiento;

    return this.evaluadoClienteService.actualizar(this.relacion!.id, relacion).pipe(
      switchMap(respuesta => personaCambio
        ? this.evaluadoService.actualizar(this.evaluado!.id, persona).pipe(
          switchMap(() => of({ message: respuesta.message + ' (también se corrigieron los datos de la persona)' })))
        : of(respuesta))
    );
  }

  /** Precarga lo guardado; las cascadas se arman con el departamento de cada ciudad. El documento no se cambia. */
  private setFormForEdit(evaluado: Evaluado, relacion: EvaluadoCliente): void {
    this.evaluado = evaluado;
    this.relacion = relacion;
    const residencia = this.todasLasCiudades.find(c => c.id === relacion.fkCiudadResidencia);
    const trabajo = this.todasLasCiudades.find(c => c.id === relacion.fkCiudadTrabajo);
    this.lstCiudadesResidencia = this.ciudadesDe(residencia?.fkDepartamento ?? null);
    this.lstCiudadesTrabajo = this.ciudadesDe(trabajo?.fkDepartamento ?? null);
    const [anio, mes, dia] = relacion.fechaVinculacion.split('-').map(Number);
    this.personaForm.patchValue({
      numeroIdentificacion: evaluado.numeroIdentificacion,
      nombre: evaluado.nombre,
      apellido: evaluado.apellido,
      fkSexo: evaluado.fkSexo,
      anioNacimiento: evaluado.anioNacimiento === null ? '' : String(evaluado.anioNacimiento),
      fkEstadoCivil: relacion.fkEstadoCivil,
      fkNivelAcademico: relacion.fkNivelAcademico,
      departamentoResidencia: residencia?.fkDepartamento ?? null,
      fkCiudadResidencia: relacion.fkCiudadResidencia,
      fkEstratoSocioeconomico: relacion.fkEstratoSocioeconomico,
      fkTipoVivienda: relacion.fkTipoVivienda,
      ocupacionProfesion: relacion.ocupacionProfesion ?? '',
      familiaresDependientesEconomicamente: relacion.familiaresDependientesEconomicamente === null ? ''
        : String(relacion.familiaresDependientesEconomicamente),
      departamentoTrabajo: trabajo?.fkDepartamento ?? null,
      fkCiudadTrabajo: relacion.fkCiudadTrabajo,
      nombreCargo: relacion.nombreCargo ?? '',
      fkTipoCargo: relacion.fkTipoCargo,
      nombreArea: relacion.nombreArea ?? '',
      antiguedadEmpresa: relacion.antiguedadEmpresa ?? '',
      fkTiempoCargo: relacion.fkTiempoCargo,
      fkTipoContrato: relacion.fkTipoContrato,
      fkHorasLabor: relacion.fkHorasLabor,
      fkTipoSalario: relacion.fkTipoSalario,
      fechaVinculacion: new Date(anio, mes - 1, dia)
    });
    this.personaForm.get('numeroIdentificacion')?.disable();
  }

  private ciudadesDe(idDepartamento: number | null): CiudadMunicipio[] {
    return idDepartamento ? this.todasLasCiudades.filter(c => c.fkDepartamento === idDepartamento) : [];
  }

  /** Recorta espacios, manda null en vez de texto vacío y la fecha como yyyy-MM-dd (sin cambiar de día por la zona). */
  private toRequest(): VincularPersonaRequest {
    const valor = this.personaForm.getRawValue();
    const texto = (v: string | null) => v?.trim() || null;
    const numero = (v: string | number | null) => v === null || String(v).trim() === '' ? null : Number(v);
    const fecha = valor.fechaVinculacion as Date | null;
    return {
      numeroIdentificacion: valor.numeroIdentificacion.trim(),
      nombre: valor.nombre.trim(),
      apellido: valor.apellido.trim(),
      fkSexo: valor.fkSexo,
      anioNacimiento: Number(valor.anioNacimiento),
      fkEstadoCivil: valor.fkEstadoCivil,
      fkNivelAcademico: valor.fkNivelAcademico,
      fkCiudadResidencia: valor.fkCiudadResidencia,
      fkEstratoSocioeconomico: valor.fkEstratoSocioeconomico,
      fkTipoVivienda: valor.fkTipoVivienda,
      ocupacionProfesion: texto(valor.ocupacionProfesion),
      familiaresDependientesEconomicamente: numero(valor.familiaresDependientesEconomicamente),
      fkCiudadTrabajo: valor.fkCiudadTrabajo,
      antiguedadEmpresa: texto(valor.antiguedadEmpresa),
      nombreCargo: texto(valor.nombreCargo),
      fkTipoCargo: valor.fkTipoCargo,
      fkTiempoCargo: valor.fkTiempoCargo,
      nombreArea: texto(valor.nombreArea),
      fkTipoContrato: valor.fkTipoContrato,
      fkHorasLabor: valor.fkHorasLabor,
      fkTipoSalario: valor.fkTipoSalario,
      fechaVinculacion: fecha
        ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
        : null
    };
  }

}
