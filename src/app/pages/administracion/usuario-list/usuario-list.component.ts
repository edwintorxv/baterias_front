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
import { forkJoin, map, of } from 'rxjs';
import { NOMBRE_ROL, Rol } from '../../../core/models/sesion.model';
import { AuthService } from '../../../core/services/auth.service';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { ClienteService } from '../../../features/clientes/services/cliente.service';
import { EvaluadorService } from '../../../features/evaluadores/services/evaluador.service';
import { Cliente } from '../../../features/clientes/models/cliente.model';
import { Evaluador } from '../../../features/evaluadores/models/evaluador.model';
import { ClientesAsignadosDialogComponent } from '../../../features/usuarios/components/clientes-asignados-dialog/clientes-asignados-dialog.component';
import { UsuarioAccionesComponent } from '../../../features/usuarios/components/usuario-acciones/usuario-acciones.component';
import { UsuarioContrasenaDialogComponent } from '../../../features/usuarios/components/usuario-contrasena-dialog/usuario-contrasena-dialog.component';
import { UsuarioFormDialogComponent } from '../../../features/usuarios/components/usuario-form-dialog/usuario-form-dialog.component';
import { SEVERIDAD_ROL, Usuario } from '../../../features/usuarios/models/usuario.model';
import { UsuarioService } from '../../../features/usuarios/services/usuario.service';

/** Fila de la tabla: el usuario con su rol y su vínculo ya resueltos para mostrar. */
interface UsuarioFila extends Usuario {
  nombreRol: string;
  severidadRol: 'contrast' | 'info' | 'success' | 'secondary';
  vinculo: string;
  /** Solo psicólogos: cuántos clientes ve. */
  clientesAsignados: number | null;
}

const normalizar = (texto: string | null | undefined) =>
  (texto ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/**
 * Usuarios del sistema (solo ADMIN): listado, crear y editar (rol, vínculo y estado), cambiar la contraseña
 * y clientes asignados a cada psicólogo.
 */
@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [
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
    ClientesAsignadosDialogComponent,
    UsuarioAccionesComponent,
    UsuarioContrasenaDialogComponent,
    UsuarioFormDialogComponent
  ],
  templateUrl: './usuario-list.component.html',
  styleUrl: './usuario-list.component.scss'
})
export class UsuarioListComponent {

  readonly opcionesRol = (Object.keys(NOMBRE_ROL) as Rol[]).map(rol => ({ label: NOMBRE_ROL[rol], value: rol }));

  searchControl = new FormControl('', { nonNullable: true });
  filtroRol: Rol | null = null;

  private usuarioOriginal: UsuarioFila[] = [];
  /** Para el formulario: evaluadores sin usuario y empresas a vincular. */
  lstEvaluadores: Evaluador[] = [];
  lstClientes: Cliente[] = [];
  lstUsuarios: UsuarioFila[] = [];
  cargando = false;

  esAdmin: Signal<boolean>;
  idUsuarioSesion: Signal<number | null>;

  displayAccionesDialog = false;
  displayClientesDialog = false;
  displayFormDialog = false;
  displayContrasenaDialog = false;
  selectedUsuario?: UsuarioFila;

  constructor(
    private usuarioService: UsuarioService,
    private clienteService: ClienteService,
    private evaluadorService: EvaluadorService,
    private messageService: MessageService,
    authService: AuthService
  ) {
    this.esAdmin = computed(() => authService.usuario()?.rol === 'ADMIN');
    this.idUsuarioSesion = computed(() => authService.usuario()?.id ?? null);
    this.searchControl.valueChanges.subscribe(() => this.filtrar());
    // Se recarga al cambiar de usuario de prueba: solo el administrador puede ver esta pantalla.
    effect(() => {
      if (this.esAdmin()) {
        this.cargar();
      } else {
        this.usuarioOriginal = [];
        this.filtrar();
      }
    });
  }

  /**
   * Usuarios + nombres de evaluadores y clientes para el vínculo + clientes asignados de cada psicólogo.
   * El administrador no ve datos de trabajadores: el vínculo del rol EVALUADO se muestra sin nombre.
   */
  cargar(): void {
    this.cargando = true;
    forkJoin({
      usuarios: this.usuarioService.listar(),
      evaluadores: this.evaluadorService.listar(),
      clientes: this.clienteService.listar()
    }).subscribe({
      next: ({ usuarios, evaluadores, clientes }) => {
        this.lstEvaluadores = evaluadores;
        this.lstClientes = [...clientes].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        const evaluador = new Map(evaluadores.map(e => [e.id, e.nombre]));
        const cliente = new Map(clientes.map(c => [c.id, c.nombre]));
        const psicologos = usuarios.filter(u => u.rol === 'PSICOLOGO');
        const asignados$ = psicologos.length
          ? forkJoin(psicologos.map(u => this.usuarioService.clientes(u.id).pipe(map(ids => [u.id, ids.length] as const))))
          : of([] as (readonly [number, number])[]);
        asignados$.subscribe({
          next: conteos => {
            const asignados = new Map(conteos);
            this.usuarioOriginal = usuarios.map(u => ({
              ...u,
              nombreRol: NOMBRE_ROL[u.rol],
              severidadRol: SEVERIDAD_ROL[u.rol],
              vinculo: this.vinculo(u, evaluador, cliente),
              clientesAsignados: u.rol === 'PSICOLOGO' ? asignados.get(u.id) ?? 0 : null
            }));
            this.filtrar();
            this.cargando = false;
          },
          error: error => this.mostrarError(error)
        });
      },
      error: error => this.mostrarError(error)
    });
  }

  /** Usuario, nombre y vínculo, mientras se escribe; y el rol elegido. */
  filtrar(): void {
    const termino = normalizar(this.searchControl.value.trim());
    this.lstUsuarios = this.usuarioOriginal.filter(u =>
      (!this.filtroRol || u.rol === this.filtroRol)
      && (!termino || [u.usuario, u.nombre, u.vinculo].some(campo => normalizar(campo).includes(termino))));
  }

  /** Todos (sin filtros): el formulario los usa para saber qué evaluadores ya tienen usuario. */
  get lstUsuariosTodos(): UsuarioFila[] {
    return this.usuarioOriginal;
  }

  limpiar(): void {
    this.filtroRol = null;
    this.searchControl.setValue('');
  }

  openAccionesDialog(usuario: UsuarioFila): void {
    this.selectedUsuario = usuario;
    this.displayAccionesDialog = true;
  }

  openClientesDialog(): void {
    this.displayAccionesDialog = false;
    this.displayClientesDialog = true;
  }

  openCrearDialog(): void {
    this.selectedUsuario = undefined;
    this.displayFormDialog = true;
  }

  openEditarDialog(): void {
    this.displayAccionesDialog = false;
    this.displayFormDialog = true;
  }

  openContrasenaDialog(): void {
    this.displayAccionesDialog = false;
    this.displayContrasenaDialog = true;
  }

  usuarioGuardado(): void {
    this.displayFormDialog = false;
    this.cargar();
  }

  clientesGuardados(): void {
    this.displayClientesDialog = false;
    this.cargar();
  }

  private vinculo(usuario: Usuario, evaluadores: Map<number, string>, clientes: Map<number, string>): string {
    switch (usuario.rol) {
      case 'PSICOLOGO':
        return usuario.idEvaluador ? evaluadores.get(usuario.idEvaluador) ?? `Evaluador ${usuario.idEvaluador}` : '';
      case 'CLIENTE':
        return usuario.idCliente ? clientes.get(usuario.idCliente) ?? `Cliente ${usuario.idCliente}` : '';
      case 'EVALUADO':
        return usuario.idEvaluado ? 'Persona evaluada' : '';
      default:
        return '';
    }
  }

  private mostrarError(error: any): void {
    this.usuarioOriginal = [];
    this.filtrar();
    this.cargando = false;
    ResponseHandlerUtil.handleError(error, this.messageService);
  }

}
