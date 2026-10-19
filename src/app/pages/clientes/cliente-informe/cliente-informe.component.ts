import { DecimalPipe } from '@angular/common';
import { Component, OnInit, Signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { AuthService } from '../../../core/services/auth.service';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { DistribucionNivelesComponent } from '../../../features/clientes/components/distribucion-niveles/distribucion-niveles.component';
import { InformeConclusionesComponent } from '../../../features/clientes/components/informe-conclusiones/informe-conclusiones.component';
import { COLOR_NIVEL, InformeEmpresa } from '../../../features/clientes/models/informe-empresa.model';
import { InformeEmpresaService } from '../../../features/clientes/services/informe-empresa.service';

/**
 * Informe de empresa de un cliente por año: resumen (cobertura, nivel de la empresa y periodicidad,
 * resultados globales), conclusiones + plan de acción y descarga del Word. Lo ven el psicólogo y el
 * cliente (este último sin editar las conclusiones). El detalle por forma, ciudad y área va en el Word.
 */
@Component({
  selector: 'app-cliente-informe',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    MessageModule,
    SelectModule,
    TableModule,
    DistribucionNivelesComponent,
    InformeConclusionesComponent
  ],
  templateUrl: './cliente-informe.component.html',
  styleUrl: './cliente-informe.component.scss'
})
export class ClienteInformeComponent implements OnInit {

  readonly colorNivel = COLOR_NIVEL;

  lstAnios: number[] = [];
  anio: number | null = null;
  informe?: InformeEmpresa;
  /** Mensaje del backend cuando el informe no sale (cliente sin personas, año sin aplicaciones…). */
  sinInforme: string | null = null;
  cargando = false;
  descargando = false;

  /** Las conclusiones las escribe solo el psicólogo. */
  puedeEditar: Signal<boolean>;
  /** El cliente no tiene acceso a /clientes: no se le muestra el botón de volver al listado. */
  puedeVolver: Signal<boolean>;

  readonly idCliente: number;

  constructor(
    route: ActivatedRoute,
    private informeEmpresaService: InformeEmpresaService,
    private messageService: MessageService,
    authService: AuthService
  ) {
    this.idCliente = Number(route.snapshot.paramMap.get('id'));
    this.puedeEditar = computed(() => authService.usuario()?.rol === 'PSICOLOGO');
    this.puedeVolver = computed(() => authService.usuario()?.rol !== 'CLIENTE');
  }

  ngOnInit(): void {
    this.cargando = true;
    this.informeEmpresaService.anios(this.idCliente).subscribe({
      next: anios => {
        this.lstAnios = anios;
        this.anio = anios[0] ?? null;
        if (this.anio) {
          this.cargarInforme();
        } else {
          this.cargando = false;
          this.sinInforme = 'El cliente aún no tiene aplicaciones.';
        }
      },
      error: error => this.mostrarError(error)
    });
  }

  cargarInforme(): void {
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

  get faltantes(): string[] {
    return this.informe?.conclusiones.faltantes ?? [];
  }

  get puedeDescargar(): boolean {
    return !!this.informe && this.faltantes.length === 0;
  }

  descargarWord(): void {
    if (!this.anio) {
      return;
    }
    this.descargando = true;
    this.informeEmpresaService.descargarWord(this.idCliente, this.anio).subscribe({
      next: ({ blob, nombre }) => {
        this.descargando = false;
        const enlace = document.createElement('a');
        enlace.href = URL.createObjectURL(blob);
        enlace.download = nombre;
        enlace.click();
        setTimeout(() => URL.revokeObjectURL(enlace.href));
      },
      error: error => {
        this.descargando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  /** Al guardar las conclusiones se vuelve a pedir el informe: de ahí salen los faltantes y el profesional. */
  conclusionesGuardadas(): void {
    this.cargarInforme();
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
