import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ClienteFila } from '../../models/cliente.model';

@Component({
  selector: 'app-cliente-table',
  standalone: true,
  imports: [TableModule, ButtonModule, CardModule, TooltipModule],
  templateUrl: './cliente-table.component.html',
  styleUrl: './cliente-table.component.scss'
})
export class ClienteTableComponent {

  @Input() lstClientes: ClienteFila[] = [];
  @Input() cargando = false;
  @Output() acciones = new EventEmitter<ClienteFila>();

}
