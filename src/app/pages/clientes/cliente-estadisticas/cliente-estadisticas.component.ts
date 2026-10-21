import { DecimalPipe } from '@angular/common';
import { Component, OnInit, Signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { AuthService } from '../../../core/services/auth.service';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { DistribucionCategoriasComponent } from '../../../features/clientes/components/distribucion-categorias/distribucion-categorias.component';
import { InformeEmpresa } from '../../../features/clientes/models/informe-empresa.model';
import { InformeEmpresaService } from '../../../features/clientes/services/informe-empresa.service';

/**
 * Estadísticas de un cliente por año: lo mismo que calcula el informe de empresa (GET /clientes/{id}/informe),
 * en pantalla y por bloques. Siempre dentro de un cliente y un año (decisión del usuario: nada de mezclar
 * empresas). El año va en la URL (?anio=) para ir y volver al informe sin perderlo.
 */
@Component({
  selector: 'app-cliente-estadisticas',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    MessageModule,
    SelectModule,
    TabsModule,
    DistribucionCategoriasComponent
  ],
  templateUrl: './cliente-estadisticas.component.html',
  styleUrl: './cliente-estadisticas.component.scss'
})
export class ClienteEstadisticasComponent implements OnInit {

  lstAnios: number[] = [];
  anio: number | null = null;
  informe?: InformeEmpresa;
  /** Mensaje del backend cuando no hay datos (cliente sin personas, año sin aplicaciones…). */
  sinInforme: string | null = null;
  cargando = false;
  pestana = 'poblacion';

  /** El cliente no tiene acceso a /clientes: no se le muestra el botón de volver al listado. */
  puedeVolver: Signal<boolean>;

  readonly idCliente: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private informeEmpresaService: InformeEmpresaService,
    private messageService: MessageService,
    authService: AuthService
  ) {
    this.idCliente = Number(route.snapshot.paramMap.get('id'));
    this.puedeVolver = computed(() => authService.usuario()?.rol !== 'CLIENTE');
  }

  ngOnInit(): void {
    const anioPedido = Number(this.route.snapshot.queryParamMap.get('anio'));
    this.cargando = true;
    this.informeEmpresaService.anios(this.idCliente).subscribe({
      next: anios => {
        this.lstAnios = anios;
        this.anio = anios.includes(anioPedido) ? anioPedido : anios[0] ?? null;
        if (this.anio) {
          this.cargar();
        } else {
          this.cargando = false;
          this.sinInforme = 'El cliente aún no tiene aplicaciones.';
        }
      },
      error: error => this.mostrarError(error)
    });
  }

  cambiarAnio(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { anio: this.anio }, replaceUrl: true });
    this.cargar();
  }

  cargar(): void {
    if (!this.anio) {
      return;
    }
    this.cargando = true;
    this.informeEmpresaService.consultar(this.idCliente, this.anio).subscribe({
      next: informe => {
        this.informe = informe;
        this.sinInforme = null;
        this.cargando = false;
      },
      error: error => this.mostrarError(error)
    });
  }

  /** 404/409 se muestran en la pantalla; el resto, como aviso. */
  private mostrarError(error: any): void {
    this.cargando = false;
    this.informe = undefined;
    if (error.status === 404 || error.status === 409) {
      this.sinInforme = ResponseHandlerUtil.describir(error).detalle;
    } else {
      ResponseHandlerUtil.handleError(error, this.messageService);
    }
  }

}
