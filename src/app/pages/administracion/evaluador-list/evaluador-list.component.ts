import { DatePipe } from '@angular/common';
import { Component, Signal, computed, effect } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../../core/services/auth.service';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { EvaluadorAccionesComponent } from '../../../features/evaluadores/components/evaluador-acciones/evaluador-acciones.component';
import { EvaluadorFirmaDialogComponent } from '../../../features/evaluadores/components/evaluador-firma-dialog/evaluador-firma-dialog.component';
import { EvaluadorFormDialogComponent } from '../../../features/evaluadores/components/evaluador-form-dialog/evaluador-form-dialog.component';
import { Evaluador } from '../../../features/evaluadores/models/evaluador.model';
import { EvaluadorService } from '../../../features/evaluadores/services/evaluador.service';

type FiltroEstado = 'ACTIVOS' | 'INACTIVOS' | 'TODOS';

const normalizar = (texto: string | null | undefined) =>
  (texto ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/**
 * Evaluadores (los profesionales que firman los informes): solo el ADMIN, que los crea, los edita y carga
 * sus firmas. El psicólogo no ve a los demás: su firma la carga en "Mi firma".
 */
@Component({
  selector: 'app-evaluador-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    Dialog,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    TableModule,
    TagModule,
    EvaluadorAccionesComponent,
    EvaluadorFirmaDialogComponent,
    EvaluadorFormDialogComponent
  ],
  templateUrl: './evaluador-list.component.html',
  styleUrl: './evaluador-list.component.scss'
})
export class EvaluadorListComponent {

  readonly opcionesEstado: { label: string; value: FiltroEstado }[] = [
    { label: 'Activos', value: 'ACTIVOS' },
    { label: 'Inactivos', value: 'INACTIVOS' },
    { label: 'Todos', value: 'TODOS' }
  ];

  searchControl = new FormControl('', { nonNullable: true });
  filtroEstado: FiltroEstado = 'ACTIVOS';

  private evaluadorOriginal: Evaluador[] = [];
  lstEvaluadores: Evaluador[] = [];
  cargando = false;

  esAdmin: Signal<boolean>;
  puedeVer: Signal<boolean>;
  /** El evaluador del psicólogo en sesión (null si no es psicólogo o no tiene). */
  idEvaluadorPropio: Signal<number | null>;

  displayFormDialog = false;
  displayAccionesDialog = false;
  displayFirmaDialog = false;
  selectedEvaluador?: Evaluador;

  constructor(
    private evaluadorService: EvaluadorService,
    private messageService: MessageService,
    authService: AuthService
  ) {
    this.esAdmin = computed(() => authService.usuario()?.rol === 'ADMIN');
    this.puedeVer = computed(() => authService.usuario()?.rol === 'ADMIN');
    this.idEvaluadorPropio = computed(() => authService.usuario()?.idEvaluador ?? null);
    this.searchControl.valueChanges.subscribe(() => this.filtrar());
    // Se recarga al cambiar de usuario de prueba.
    effect(() => {
      if (this.puedeVer()) {
        this.cargar();
      } else {
        this.evaluadorOriginal = [];
        this.filtrar();
      }
    });
  }

  cargar(): void {
    this.cargando = true;
    this.evaluadorService.listar().subscribe({
      next: evaluadores => {
        this.evaluadorOriginal = [...evaluadores].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        this.filtrar();
        this.cargando = false;
      },
      error: error => {
        this.evaluadorOriginal = [];
        this.filtrar();
        this.cargando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  /** Nombre, documento, profesión, tarjeta o licencia, mientras se escribe; y el estado elegido. */
  filtrar(): void {
    const termino = normalizar(this.searchControl.value.trim());
    this.lstEvaluadores = this.evaluadorOriginal.filter(e =>
      (this.filtroEstado === 'TODOS' || e.activo === (this.filtroEstado === 'ACTIVOS'))
      && (!termino || [e.nombre, e.numeroIdentificacion, e.profesion, e.posgrado, e.tarjetaProfesional,
        e.licenciaSaludOcupacional].some(campo => normalizar(campo).includes(termino))));
  }

  limpiar(): void {
    this.filtroEstado = 'ACTIVOS';
    this.searchControl.setValue('');
  }

  esPropio(evaluador: Evaluador): boolean {
    return evaluador.id === this.idEvaluadorPropio();
  }

  openCrearDialog(): void {
    this.selectedEvaluador = undefined;
    this.displayFormDialog = true;
  }

  openAccionesDialog(evaluador: Evaluador): void {
    this.selectedEvaluador = evaluador;
    this.displayAccionesDialog = true;
  }

  openEditarDialog(): void {
    this.displayAccionesDialog = false;
    this.displayFormDialog = true;
  }

  openFirmaDialog(): void {
    this.displayAccionesDialog = false;
    this.displayFirmaDialog = true;
  }

  /** Después de crear, editar o cambiar la firma: se cierra el diálogo y se recarga la lista. */
  evaluadorGuardado(): void {
    this.displayFormDialog = false;
    this.displayFirmaDialog = false;
    this.cargar();
  }

}
