import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ApiError } from '../../../../core/models/api-response.model';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { FilaCarga, RESULTADO_FILA, ResultadoCarga, ResultadoFila } from '../../models/carga-personas.model';
import { ClienteService } from '../../services/cliente.service';

/** Error que se muestra dentro del diálogo (archivo inválido, columnas cambiadas, filas con error al confirmar). */
interface ErrorCarga {
  titulo: string;
  mensaje: string;
  detalles: string[];
}

const MAXIMO_BYTES = 5 * 1024 * 1024;

/**
 * Carga de personas desde la plantilla Excel: al elegir el archivo se valida (no guarda nada) y se muestra
 * qué pasará con cada fila; "Confirmar carga" guarda todas o ninguna. Se crea de nuevo cada vez que se abre.
 */
@Component({
  selector: 'app-carga-personas-dialog',
  standalone: true,
  imports: [ButtonModule, MessageModule, TableModule, TagModule, TooltipModule],
  templateUrl: './carga-personas-dialog.component.html',
  styleUrl: './carga-personas-dialog.component.scss'
})
export class CargaPersonasDialogComponent {

  @Input({ required: true }) idCliente!: number;
  @Output() guardado = new EventEmitter<ResultadoCarga>();
  @Output() cancel = new EventEmitter<void>();

  readonly resultados = Object.keys(RESULTADO_FILA) as ResultadoFila[];
  readonly resultadoFila = RESULTADO_FILA;

  archivo: File | null = null;
  resultado?: ResultadoCarga;
  lstFilas: FilaCarga[] = [];
  filtro: ResultadoFila | null = null;
  error: ErrorCarga | null = null;
  validando = false;
  confirmando = false;

  constructor(
    private clienteService: ClienteService,
    private messageService: MessageService
  ) { }

  /** Al elegir el archivo se valida de una vez. */
  onArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    input.value = ''; // para poder volver a elegir el mismo archivo después de corregirlo
    if (!archivo) {
      return;
    }
    this.archivo = archivo;
    this.resultado = undefined;
    this.lstFilas = [];
    this.error = null;
    if (!archivo.name.toLowerCase().endsWith('.xlsx')) {
      this.error = { titulo: 'Archivo no válido', mensaje: 'Suba la plantilla de personas en Excel (.xlsx).', detalles: [] };
      return;
    }
    if (archivo.size > MAXIMO_BYTES) {
      this.error = { titulo: 'Archivo muy grande', mensaje: 'El archivo pesa más de 5 MB: divídalo en varios.', detalles: [] };
      return;
    }
    this.validar();
  }

  validar(): void {
    if (!this.archivo) {
      return;
    }
    this.validando = true;
    this.clienteService.cargarPersonas(this.idCliente, this.archivo, false).subscribe({
      next: respuesta => {
        this.validando = false;
        this.resultado = respuesta.data;
        // Con errores se muestran primero esas filas, que son las que hay que corregir.
        this.aplicarFiltro(respuesta.data.puedeConfirmar ? null : 'ERROR');
      },
      error: error => {
        this.validando = false;
        this.mostrarError(error);
      }
    });
  }

  /** Guarda todas las filas, o ninguna si alguna tiene error (el backend vuelve a validar). */
  confirmar(): void {
    if (!this.archivo || !this.resultado?.puedeConfirmar) {
      return;
    }
    this.confirmando = true;
    this.clienteService.cargarPersonas(this.idCliente, this.archivo, true).subscribe({
      next: respuesta => {
        this.confirmando = false;
        ResponseHandlerUtil.handleResponse(respuesta, this.messageService);
        this.guardado.emit(respuesta.data);
      },
      error: error => {
        this.confirmando = false;
        this.resultado = undefined;
        this.mostrarError(error);
      }
    });
  }

  info(resultado: ResultadoFila) {
    return RESULTADO_FILA[resultado];
  }

  /** Clic en una tarjeta del resumen: solo esas filas (o todas si ya estaba). */
  filtrar(resultado: ResultadoFila): void {
    this.aplicarFiltro(this.filtro === resultado ? null : resultado);
  }

  private aplicarFiltro(resultado: ResultadoFila | null): void {
    this.filtro = resultado;
    const filas = this.resultado?.filas ?? [];
    this.lstFilas = this.filtro ? filas.filter(f => f.resultado === this.filtro) : filas;
  }

  private mostrarError(error: HttpErrorResponse): void {
    if (error.status === 400 || error.status === 404 || error.status === 409) {
      const { titulo, detalle } = ResponseHandlerUtil.describir(error);
      const apiError = error.error as ApiError | null;
      this.error = { titulo, mensaje: apiError?.message ?? detalle, detalles: apiError?.details ?? [] };
    } else {
      ResponseHandlerUtil.handleError(error, this.messageService);
    }
  }

}
