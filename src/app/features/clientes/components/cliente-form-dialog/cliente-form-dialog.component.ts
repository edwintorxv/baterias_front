import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
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
import { Industria } from '../../../../shared/models/industria.model';
import { CustomValidators } from '../../../../shared/validators/custom-validators';
import { Cliente, ClienteRequest } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente.service';

/**
 * Crear o editar un cliente (solo ADMIN). Se crea de nuevo cada vez que se abre el diálogo, así que
 * no hay que limpiar el formulario entre una apertura y otra.
 */
@Component({
  selector: 'app-cliente-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    SelectModule,
    ButtonModule,
    ErrorCampoComponent
  ],
  templateUrl: './cliente-form-dialog.component.html',
  styleUrl: './cliente-form-dialog.component.scss'
})
export class ClienteFormDialogComponent implements OnInit {

  @Input() cliente?: Cliente;
  @Output() saved = new EventEmitter<Cliente>();
  @Output() cancel = new EventEmitter<void>();

  clienteForm: FormGroup;

  lstSectores: Catalogo[] = [];
  lstIndustrias: Industria[] = [];
  private todasLasIndustrias: Industria[] = [];
  lstDepartamentos: Departamento[] = [];
  lstCiudadMunicipio: CiudadMunicipio[] = [];
  private todasLasCiudades: CiudadMunicipio[] = [];

  guardando = false;

  constructor(
    private formBuilder: FormBuilder,
    private catalogoService: CatalogoService,
    private clienteService: ClienteService,
    private messageService: MessageService
  ) {
    // Los largos máximos son los del backend (ClienteRequest).
    this.clienteForm = this.formBuilder.group({
      nit: ['', [Validators.required, Validators.maxLength(50), CustomValidators.nit]],
      nombre: ['', [Validators.required, Validators.maxLength(300), CustomValidators.texto]],
      sector: [null as number | null, [Validators.required]],
      fkIndustria: [null as number | null, [Validators.required]],
      departamento: [null as number | null],
      fkCiudadMunicipio: [null as number | null],
      direccion: ['', [Validators.maxLength(300), CustomValidators.direccion]],
      telefono: ['', [Validators.maxLength(50), CustomValidators.telefono]],
      nombreContacto: ['', [Validators.maxLength(200), CustomValidators.soloLetras]],
      cargoContacto: ['', [Validators.maxLength(150), CustomValidators.texto]],
      telefonoContacto: ['', [Validators.maxLength(50), CustomValidators.telefono]]
    });
  }

  get isEditMode(): boolean {
    return !!this.cliente;
  }

  ngOnInit(): void {
    forkJoin({
      sectores: this.catalogoService.sectoresEconomicos(),
      industrias: this.catalogoService.industrias(),
      departamentos: this.catalogoService.departamentos(),
      ciudades: this.catalogoService.ciudades()
    }).subscribe({
      next: ({ sectores, industrias, departamentos, ciudades }) => {
        this.lstSectores = sectores;
        this.todasLasIndustrias = industrias;
        this.lstDepartamentos = departamentos;
        this.todasLasCiudades = ciudades;
        if (this.cliente) {
          this.setFormForEdit(this.cliente);
        }
      },
      error: error => ResponseHandlerUtil.handleError(error, this.messageService)
    });
  }

  /** Al cambiar el sector se filtran las industrias y se borra la que estaba elegida. */
  onSectorChange(idSector: number | null): void {
    this.filtrarIndustrias(idSector);
    this.clienteForm.patchValue({ fkIndustria: null });
  }

  /** Al cambiar el departamento se filtran las ciudades y se borra la que estaba elegida. */
  onDepartamentoChange(idDepartamento: number | null): void {
    this.filtrarCiudades(idDepartamento);
    this.clienteForm.patchValue({ fkCiudadMunicipio: null });
  }

  saveCliente(): void {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    const request = this.toRequest();
    const peticion = this.cliente
      ? this.clienteService.actualizar(this.cliente.id, request)
      : this.clienteService.crear(request);

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

  /** El NIT identifica al cliente: al editar se muestra pero no se cambia. */
  private setFormForEdit(cliente: Cliente): void {
    const industria = this.todasLasIndustrias.find(i => i.id === cliente.fkIndustria);
    const ciudad = this.todasLasCiudades.find(c => c.id === cliente.fkCiudadMunicipio);
    this.filtrarIndustrias(industria?.fkSectorEconomico ?? null);
    this.filtrarCiudades(ciudad?.fkDepartamento ?? null);
    this.clienteForm.patchValue({
      nit: cliente.nit,
      nombre: cliente.nombre,
      sector: industria?.fkSectorEconomico ?? null,
      fkIndustria: cliente.fkIndustria,
      departamento: ciudad?.fkDepartamento ?? null,
      fkCiudadMunicipio: cliente.fkCiudadMunicipio,
      direccion: cliente.direccion ?? '',
      telefono: cliente.telefono ?? '',
      nombreContacto: cliente.nombreContacto ?? '',
      cargoContacto: cliente.cargoContacto ?? '',
      telefonoContacto: cliente.telefonoContacto ?? ''
    });
    this.clienteForm.get('nit')?.disable();
  }

  private filtrarIndustrias(idSector: number | null): void {
    this.lstIndustrias = idSector
      ? this.todasLasIndustrias.filter(i => i.fkSectorEconomico === idSector)
      : [];
  }

  private filtrarCiudades(idDepartamento: number | null): void {
    this.lstCiudadMunicipio = idDepartamento
      ? this.todasLasCiudades.filter(c => c.fkDepartamento === idDepartamento)
      : [];
  }

  /** Recorta espacios y manda null en vez de texto vacío. */
  private toRequest(): ClienteRequest {
    const valor = this.clienteForm.getRawValue();
    const texto = (v: string | null) => v?.trim() || null;
    return {
      nit: valor.nit.trim(),
      nombre: valor.nombre.trim(),
      fkIndustria: valor.fkIndustria,
      fkCiudadMunicipio: valor.fkCiudadMunicipio,
      direccion: texto(valor.direccion),
      telefono: texto(valor.telefono),
      nombreContacto: texto(valor.nombreContacto),
      cargoContacto: texto(valor.cargoContacto),
      telefonoContacto: texto(valor.telefonoContacto)
    };
  }

}
