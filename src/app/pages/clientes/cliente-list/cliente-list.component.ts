import { Component, Signal, computed, effect } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { ClienteAccionesComponent } from '../../../features/clientes/components/cliente-acciones/cliente-acciones.component';
import { ClienteFormDialogComponent } from '../../../features/clientes/components/cliente-form-dialog/cliente-form-dialog.component';
import { ClienteTableComponent } from '../../../features/clientes/components/cliente-table/cliente-table.component';
import { Cliente, ClienteFila } from '../../../features/clientes/models/cliente.model';
import { ClienteService } from '../../../features/clientes/services/cliente.service';

/** Sin mayúsculas ni tildes, para buscar "medellin" y encontrar "MEDELLÍN". */
const normalizar = (texto: string | null | undefined) =>
  (texto ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    Dialog,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ClienteTableComponent,
    ClienteFormDialogComponent,
    ClienteAccionesComponent
  ],
  templateUrl: './cliente-list.component.html',
  styleUrl: './cliente-list.component.scss'
})
export class ClienteListComponent {

  searchControl = new FormControl('', { nonNullable: true });

  /** Todos los clientes que el usuario puede ver (el psicólogo, solo los asignados). */
  private clienteOriginal: ClienteFila[] = [];
  lstClientes: ClienteFila[] = [];
  cargando = false;

  esAdmin: Signal<boolean>;
  esPsicologo: Signal<boolean>;

  displayAccionesDialog = false;
  displayFormDialog = false;
  selectedCliente?: ClienteFila;

  constructor(
    private clienteService: ClienteService,
    private catalogoService: CatalogoService,
    private messageService: MessageService,
    private router: Router,
    authService: AuthService
  ) {
    this.esAdmin = computed(() => authService.usuario()?.rol === 'ADMIN');
    this.esPsicologo = computed(() => authService.usuario()?.rol === 'PSICOLOGO');
    this.searchControl.valueChanges.subscribe(() => this.filtrar());
    // Se recarga al cambiar de usuario de prueba: cada rol ve clientes distintos.
    effect(() => {
      authService.usuario();
      this.cargarClientes();
    });
  }

  cargarClientes(): void {
    this.cargando = true;
    forkJoin({
      clientes: this.clienteService.listar(),
      industrias: this.catalogoService.industrias(),
      departamentos: this.catalogoService.departamentos(),
      ciudades: this.catalogoService.ciudades()
    }).subscribe({
      next: ({ clientes, industrias, departamentos, ciudades }) => {
        const industria = new Map(industrias.map(i => [i.id, i.nombre]));
        const departamento = new Map(departamentos.map(d => [d.id, d.nombre]));
        const ciudad = new Map(ciudades.map(c => [c.id, c]));
        this.clienteOriginal = clientes.map(c => {
          const ciudadCliente = c.fkCiudadMunicipio ? ciudad.get(c.fkCiudadMunicipio) : undefined;
          return {
            ...c,
            industria: industria.get(c.fkIndustria) ?? '',
            ciudad: ciudadCliente?.nombre ?? '',
            departamento: ciudadCliente ? departamento.get(ciudadCliente.fkDepartamento) ?? '' : ''
          };
        });
        this.filtrar();
        this.cargando = false;
      },
      error: error => {
        this.clienteOriginal = [];
        this.filtrar();
        this.cargando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  /** Busca en NIT, razón social, industria, ciudad y contacto mientras se escribe. */
  filtrar(): void {
    const termino = normalizar(this.searchControl.value.trim());
    this.lstClientes = !termino ? this.clienteOriginal : this.clienteOriginal.filter(c =>
      [c.nit, c.nombre, c.industria, c.ciudad, c.departamento, c.nombreContacto]
        .some(campo => normalizar(campo).includes(termino)));
  }

  limpiar(): void {
    this.searchControl.setValue('');
  }

  openAccionesDialog(cliente: ClienteFila): void {
    this.selectedCliente = cliente;
    this.displayAccionesDialog = true;
  }

  openFormCreateDialog(): void {
    this.selectedCliente = undefined;
    this.displayFormDialog = true;
  }

  openFormEditDialog(cliente: ClienteFila): void {
    this.selectedCliente = cliente;
    this.displayAccionesDialog = false;
    this.displayFormDialog = true;
  }

  verPersonas(cliente: ClienteFila): void {
    this.displayAccionesDialog = false;
    this.router.navigate(['/clientes', cliente.id, 'personas']);
  }

  clienteSaved(_cliente: Cliente): void {
    this.displayFormDialog = false;
    this.cargarClientes();
  }

}
