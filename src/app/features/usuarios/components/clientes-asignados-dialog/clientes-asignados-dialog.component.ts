import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { forkJoin } from 'rxjs';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { Cliente } from '../../../clientes/models/cliente.model';
import { ClienteService } from '../../../clientes/services/cliente.service';
import { Usuario } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';

interface OpcionCliente {
  cliente: Cliente;
  marcado: boolean;
}

const normalizar = (texto: string | null | undefined) =>
  (texto ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/**
 * Clientes que ve un psicólogo (solo ADMIN): todos los clientes con casillas; al guardar se reemplaza la
 * lista completa. Se crea de nuevo cada vez que se abre el diálogo.
 */
@Component({
  selector: 'app-clientes-asignados-dialog',
  standalone: true,
  imports: [FormsModule, ButtonModule, CheckboxModule, IconFieldModule, InputIconModule, InputTextModule, MessageModule],
  templateUrl: './clientes-asignados-dialog.component.html',
  styleUrl: './clientes-asignados-dialog.component.scss'
})
export class ClientesAsignadosDialogComponent implements OnInit {

  @Input({ required: true }) usuario!: Usuario;
  @Output() saved = new EventEmitter<number[]>();
  @Output() cancel = new EventEmitter<void>();

  private opciones: OpcionCliente[] = [];
  lstOpciones: OpcionCliente[] = [];
  busqueda = '';
  cargando = false;
  guardando = false;

  constructor(
    private clienteService: ClienteService,
    private usuarioService: UsuarioService,
    private messageService: MessageService
  ) { }

  get marcados(): number {
    return this.opciones.filter(o => o.marcado).length;
  }

  get total(): number {
    return this.opciones.length;
  }

  ngOnInit(): void {
    this.cargando = true;
    forkJoin({
      clientes: this.clienteService.listar(),
      asignados: this.usuarioService.clientes(this.usuario.id)
    }).subscribe({
      next: ({ clientes, asignados }) => {
        const marcados = new Set(asignados);
        // Primero los que ya tiene, luego el resto; cada grupo por razón social.
        this.opciones = clientes
          .map(cliente => ({ cliente, marcado: marcados.has(cliente.id) }))
          .sort((a, b) => Number(b.marcado) - Number(a.marcado) || a.cliente.nombre.localeCompare(b.cliente.nombre, 'es'));
        this.filtrar();
        this.cargando = false;
      },
      error: error => {
        this.cargando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  /** Por NIT o razón social, sin distinguir tildes ni mayúsculas. */
  filtrar(): void {
    const termino = normalizar(this.busqueda.trim());
    this.lstOpciones = !termino ? this.opciones : this.opciones.filter(o =>
      normalizar(o.cliente.nit).includes(termino) || normalizar(o.cliente.nombre).includes(termino));
  }

  /** Marca o desmarca los que se ven (con la búsqueda aplicada). */
  marcarVisibles(marcado: boolean): void {
    this.lstOpciones.forEach(o => o.marcado = marcado);
  }

  guardar(): void {
    const ids = this.opciones.filter(o => o.marcado).map(o => o.cliente.id);
    this.guardando = true;
    this.usuarioService.asignarClientes(this.usuario.id, ids).subscribe({
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

}
