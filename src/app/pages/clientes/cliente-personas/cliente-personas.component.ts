import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { forkJoin } from 'rxjs';
import { guardarArchivo } from '../../../core/utils/archivo.util';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { CargaPersonasDialogComponent } from '../../../features/clientes/components/carga-personas-dialog/carga-personas-dialog.component';
import { PersonaAplicacionesDialogComponent } from '../../../features/aplicaciones/components/persona-aplicaciones-dialog/persona-aplicaciones-dialog.component';
import { InformeIndividualDialogComponent } from '../../../features/clientes/components/informe-individual-dialog/informe-individual-dialog.component';
import { PersonaAccionesComponent } from '../../../features/clientes/components/persona-acciones/persona-acciones.component';
import { PersonaEstadoDialogComponent } from '../../../features/clientes/components/persona-estado-dialog/persona-estado-dialog.component';
import { VincularPersonaDialogComponent } from '../../../features/clientes/components/vincular-persona-dialog/vincular-persona-dialog.component';
import { Cliente } from '../../../features/clientes/models/cliente.model';
import {
  PersonaCliente,
  SITUACION_PERSONA,
  SituacionPersona,
  situacionPersona
} from '../../../features/clientes/models/persona-cliente.model';
import { ClienteService } from '../../../features/clientes/services/cliente.service';

/** Fila de la tabla: la persona con su nombre completo y su situación ya resueltos. */
interface PersonaFila extends PersonaCliente {
  nombreCompleto: string;
  situacion: SituacionPersona;
  etiquetaSituacion: string;
  severidadSituacion: 'success' | 'warn' | 'secondary';
  fechaUltima: string | null;
}

type FiltroEstado = 'ACTIVOS' | 'INACTIVOS' | 'TODOS';

const normalizar = (texto: string | null | undefined) =>
  (texto ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/** Personas de un cliente (solo el psicólogo): quiénes son, dónde trabajan y en qué va su aplicación. */
@Component({
  selector: 'app-cliente-personas',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    Dialog,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    CargaPersonasDialogComponent,
    VincularPersonaDialogComponent,
    PersonaAccionesComponent,
    PersonaEstadoDialogComponent,
    InformeIndividualDialogComponent,
    PersonaAplicacionesDialogComponent
  ],
  templateUrl: './cliente-personas.component.html',
  styleUrl: './cliente-personas.component.scss'
})
export class ClientePersonasComponent implements OnInit {

  readonly opcionesEstado: { label: string; value: FiltroEstado }[] = [
    { label: 'Activos', value: 'ACTIVOS' },
    { label: 'Inactivos', value: 'INACTIVOS' },
    { label: 'Todos', value: 'TODOS' }
  ];

  readonly opcionesSituacion = (Object.keys(SITUACION_PERSONA) as SituacionPersona[])
    .map(clave => ({ label: SITUACION_PERSONA[clave].etiqueta, value: clave }));

  searchControl = new FormControl('', { nonNullable: true });
  filtroEstado: FiltroEstado = 'ACTIVOS';
  filtroSituacion: SituacionPersona | null = null;

  cliente?: Cliente;
  private personaOriginal: PersonaFila[] = [];
  lstPersonas: PersonaFila[] = [];
  cargando = false;

  /** Conteos de las personas activas, para las tarjetas de arriba. */
  resumen = { activos: 0, conResultados: 0, pendientes: 0, sinRespuestas: 0, sinAplicacion: 0, inactivos: 0 };

  displayCargaDialog = false;
  displayVincularDialog = false;
  displayAccionesDialog = false;
  displayEditarDialog = false;
  displayEstadoDialog = false;
  displayInformeDialog = false;
  displayAplicacionesDialog = false;
  selectedPersona?: PersonaFila;
  descargandoPlantilla = false;

  readonly idCliente: number;

  constructor(
    route: ActivatedRoute,
    private clienteService: ClienteService,
    private messageService: MessageService
  ) {
    this.idCliente = Number(route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.searchControl.valueChanges.subscribe(() => this.filtrar());
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    forkJoin({
      cliente: this.clienteService.obtener(this.idCliente),
      personas: this.clienteService.personas(this.idCliente)
    }).subscribe({
      next: ({ cliente, personas }) => {
        this.cliente = cliente;
        this.personaOriginal = personas.map(p => {
          const situacion = situacionPersona(p);
          return {
            ...p,
            nombreCompleto: `${p.apellido.trim()} ${p.nombre.trim()}`,
            situacion,
            etiquetaSituacion: SITUACION_PERSONA[situacion].etiqueta,
            severidadSituacion: SITUACION_PERSONA[situacion].severidad,
            fechaUltima: p.ultimaAplicacion?.fecha ?? null
          };
        });
        this.calcularResumen();
        this.filtrar();
        this.cargando = false;
      },
      error: error => {
        this.cargando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  /** Texto (documento, nombre, cargo, área, ciudad) + estado de la relación + situación de la aplicación. */
  filtrar(): void {
    const termino = normalizar(this.searchControl.value.trim());
    this.lstPersonas = this.personaOriginal.filter(p =>
      (this.filtroEstado === 'TODOS' || p.activo === (this.filtroEstado === 'ACTIVOS'))
      && (!this.filtroSituacion || p.situacion === this.filtroSituacion)
      && (!termino || [p.numeroIdentificacion, p.nombreCompleto, p.nombreCargo, p.tipoCargo, p.nombreArea, p.ciudadTrabajo]
        .some(campo => normalizar(campo).includes(termino))));
  }

  /** Clic en una tarjeta del resumen: filtra por esa situación (o quita el filtro si ya estaba). */
  filtrarPorSituacion(situacion: SituacionPersona | null): void {
    this.filtroSituacion = this.filtroEstado === 'ACTIVOS' && this.filtroSituacion === situacion ? null : situacion;
    this.filtroEstado = 'ACTIVOS';
    this.filtrar();
  }

  /** Tarjeta "Inactivas": las que ya no están en la empresa (o vuelve a las activas si ya estaba). */
  verInactivas(): void {
    this.filtroEstado = this.filtroEstado === 'INACTIVOS' ? 'ACTIVOS' : 'INACTIVOS';
    this.filtroSituacion = null;
    this.filtrar();
  }

  /** Siempre vacía: el cliente entrega su base y aquí se pasa al formato del sistema. */
  descargarPlantilla(): void {
    this.descargandoPlantilla = true;
    this.clienteService.plantillaPersonas(this.idCliente).subscribe({
      next: archivo => {
        this.descargandoPlantilla = false;
        guardarArchivo(archivo);
      },
      error: error => {
        this.descargandoPlantilla = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  openAccionesDialog(persona: PersonaFila): void {
    this.selectedPersona = persona;
    this.displayAccionesDialog = true;
  }

  openEditarDialog(): void {
    this.displayAccionesDialog = false;
    this.displayEditarDialog = true;
  }

  openEstadoDialog(): void {
    this.displayAccionesDialog = false;
    this.displayEstadoDialog = true;
  }

  openAplicacionesDialog(): void {
    this.displayAccionesDialog = false;
    this.displayAplicacionesDialog = true;
  }

  openInformeDialog(): void {
    this.displayAccionesDialog = false;
    this.displayInformeDialog = true;
  }

  /** Después de editar, inactivar o activar: se cierra el diálogo y se recarga la lista. */
  personaGuardada(): void {
    this.displayEditarDialog = false;
    this.displayEstadoDialog = false;
    this.cargar();
  }

  personaVinculada(): void {
    this.displayVincularDialog = false;
    this.cargar();
  }

  cargaGuardada(): void {
    this.displayCargaDialog = false;
    this.cargar();
  }

  limpiar(): void {
    this.filtroEstado = 'ACTIVOS';
    this.filtroSituacion = null;
    this.searchControl.setValue('');
  }

  private calcularResumen(): void {
    const activos = this.personaOriginal.filter(p => p.activo);
    this.resumen = {
      activos: activos.length,
      conResultados: activos.filter(p => p.situacion === 'CON_RESULTADOS').length,
      pendientes: activos.filter(p => p.situacion === 'PENDIENTE_CALCULO').length,
      sinRespuestas: activos.filter(p => p.situacion === 'SIN_RESPUESTAS').length,
      sinAplicacion: activos.filter(p => p.situacion === 'SIN_APLICACION').length,
      inactivos: this.personaOriginal.length - activos.length
    };
  }

}
