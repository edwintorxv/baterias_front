import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { forkJoin } from 'rxjs';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { ErrorCampoComponent } from '../../../../shared/components/error-campo/error-campo.component';
import { Catalogo } from '../../../../shared/models/catalogo.model';
import { CiudadMunicipio } from '../../../../shared/models/ciudad-municipio.model';
import { Departamento } from '../../../../shared/models/departamento.model';
import { CustomValidators } from '../../../../shared/validators/custom-validators';
import {
  EDAD_MAXIMA,
  EDAD_MINIMA,
  VinculacionResponse,
  VincularPersonaRequest
} from '../../models/vincular-persona.model';
import { ClienteService } from '../../services/cliente.service';

/**
 * Vincular una persona al cliente (solo PSICOLOGO). No busca ni prellena por documento: siempre se
 * recapturan los datos, y el backend decide si es nueva, ya existía, ya estaba en el cliente o cambia de
 * empresa (el mensaje lo dice). Se crea de nuevo cada vez que se abre el diálogo.
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
  @Output() saved = new EventEmitter<VinculacionResponse>();
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

  constructor(
    private formBuilder: FormBuilder,
    private catalogoService: CatalogoService,
    private clienteService: ClienteService,
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

  ngOnInit(): void {
    forkJoin({
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
      },
      error: error => ResponseHandlerUtil.handleError(error, this.messageService)
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
    this.guardando = true;
    this.clienteService.vincularPersona(this.idCliente, this.toRequest()).subscribe({
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
