import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { ResponseHandlerUtil } from '../../../../core/utils/response-handler.util';
import { EvaluadoCliente } from '../../../evaluados/models/evaluado-cliente.model';
import { EvaluadoClienteService } from '../../../evaluados/services/evaluado-cliente.service';
import { PersonaCliente } from '../../models/persona-cliente.model';

const aFecha = (texto: string) => {
  const [anio, mes, dia] = texto.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
};

const aTexto = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

/**
 * Inactivar (con fecha de retiro) o activar la relación de una persona con el cliente. Se manda la relación
 * tal como está, cambiando solo el estado. Se crea de nuevo cada vez que se abre el diálogo.
 */
@Component({
  selector: 'app-persona-estado-dialog',
  standalone: true,
  imports: [DatePipe, FormsModule, ButtonModule, DatePickerModule, MessageModule],
  templateUrl: './persona-estado-dialog.component.html',
  styleUrl: './persona-estado-dialog.component.scss'
})
export class PersonaEstadoDialogComponent implements OnInit {

  @Input({ required: true }) persona!: PersonaCliente;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  relacion?: EvaluadoCliente;
  fechaRetiro: Date = new Date();
  fechaVinculacion?: Date;
  guardando = false;

  constructor(
    private evaluadoClienteService: EvaluadoClienteService,
    private messageService: MessageService
  ) { }

  get inactivar(): boolean {
    return this.persona.activo;
  }

  ngOnInit(): void {
    this.evaluadoClienteService.obtener(this.persona.idRelacion).subscribe({
      next: relacion => {
        this.relacion = relacion;
        this.fechaVinculacion = aFecha(relacion.fechaVinculacion);
      },
      error: error => ResponseHandlerUtil.handleError(error, this.messageService)
    });
  }

  guardar(): void {
    if (!this.relacion) {
      return;
    }
    const { id, ...datos } = this.relacion;
    this.guardando = true;
    this.evaluadoClienteService.actualizar(id, {
      ...datos,
      fechaVinculacion: null,
      activo: !this.inactivar,
      fechaRetiro: this.inactivar ? aTexto(this.fechaRetiro) : null
    }).subscribe({
      next: () => {
        this.guardando = false;
        this.messageService.add({
          severity: 'success', summary: 'Listo', life: 4000,
          detail: this.inactivar
            ? 'Persona inactivada en el cliente. La encuentra en la tarjeta "Inactivas" o con el filtro Inactivos.'
            : 'Persona activada en el cliente'
        });
        this.saved.emit();
      },
      error: error => {
        this.guardando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

}
