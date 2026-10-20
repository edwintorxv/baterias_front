import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { Evaluador, FIRMA_MAXIMO_BYTES, FIRMA_TIPOS } from '../../models/evaluador.model';
import { EvaluadorService } from '../../services/evaluador.service';

/**
 * Firma del evaluador (sale en los informes individual y de empresa): ver la actual y reemplazarla.
 * Solo el propio evaluador o el ADMIN. No se borra: se reemplaza por otra.
 */
@Component({
  selector: 'app-evaluador-firma-dialog',
  standalone: true,
  imports: [ButtonModule, MessageModule],
  templateUrl: './evaluador-firma-dialog.component.html',
  styleUrl: './evaluador-firma-dialog.component.scss'
})
export class EvaluadorFirmaDialogComponent implements OnInit, OnDestroy {

  @Input({ required: true }) evaluador!: Evaluador;
  @Output() saved = new EventEmitter<Evaluador>();
  @Output() cancel = new EventEmitter<void>();

  readonly tiposAceptados = FIRMA_TIPOS.join(',');

  urlActual: string | null = null;
  urlNueva: string | null = null;
  archivo: File | null = null;
  errorArchivo: string | null = null;
  cargando = false;
  guardando = false;

  constructor(
    private evaluadorService: EvaluadorService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    if (!this.evaluador.tieneFirma) {
      return;
    }
    this.cargando = true;
    this.evaluadorService.firma(this.evaluador.id).subscribe({
      next: imagen => {
        this.cargando = false;
        this.urlActual = URL.createObjectURL(imagen);
      },
      error: () => {
        this.cargando = false;
        this.messageService.add({ severity: 'warn', summary: 'Firma', detail: 'No se pudo cargar la firma actual.' });
      }
    });
  }

  ngOnDestroy(): void {
    this.liberar(this.urlActual);
    this.liberar(this.urlNueva);
  }

  /** Valida tipo y tamaño antes de enviarla (el backend valida lo mismo). */
  elegir(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const archivo = entrada.files?.[0] ?? null;
    entrada.value = '';
    if (!archivo) {
      return;
    }
    this.liberar(this.urlNueva);
    this.urlNueva = null;
    this.archivo = null;
    if (!FIRMA_TIPOS.includes(archivo.type)) {
      this.errorArchivo = 'La firma debe ser una imagen PNG o JPG.';
      return;
    }
    if (archivo.size > FIRMA_MAXIMO_BYTES) {
      this.errorArchivo = 'La firma supera el tamaño máximo de 1 MB.';
      return;
    }
    this.errorArchivo = null;
    this.archivo = archivo;
    this.urlNueva = URL.createObjectURL(archivo);
  }

  guardar(): void {
    if (!this.archivo) {
      return;
    }
    this.guardando = true;
    this.evaluadorService.guardarFirma(this.evaluador.id, this.archivo).subscribe({
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

  private liberar(url: string | null): void {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }

}
