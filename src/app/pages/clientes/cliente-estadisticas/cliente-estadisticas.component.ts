import { DecimalPipe } from '@angular/common';
import { Component, OnInit, Signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TabsModule } from 'primeng/tabs';
import { AuthService } from '../../../core/services/auth.service';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { DistribucionNivelesComponent } from '../../../features/clientes/components/distribucion-niveles/distribucion-niveles.component';
import { DistribucionCategoriasComponent } from '../../../features/clientes/components/distribucion-categorias/distribucion-categorias.component';
import { FilaNiveles, NivelesPorGrupoComponent } from '../../../features/clientes/components/niveles-por-grupo/niveles-por-grupo.component';
import { DesgloseGrupos, DistribucionNiveles, InformeEmpresa } from '../../../features/clientes/models/informe-empresa.model';
import { InformeEmpresaService } from '../../../features/clientes/services/informe-empresa.service';

const CONCENTRACION = 'AB';

const CRITERIO_RANKING = 'Del más crítico al menos crítico: primero el mayor % en muy alto, luego en alto, y así hacia abajo '
  + '(sin sumar niveles).';

interface VistaIntralaboral {
  /** Solo en una forma. */
  forma?: string;
  personas?: number;
  dominios: FilaNiveles[];
  dimensiones?: FilaNiveles[];
  /** Cada dominio con sus dimensiones (como las fichas del Word). */
  fichas?: { nombre: string; dimensiones: FilaNiveles[] }[];
  /** Solo en A + B. */
  porCiudad?: FilaNiveles[];
  notaCiudad?: string;
  porArea?: FilaNiveles[];
  notaArea?: string;
}

interface VistaExtralaboral {
  dimensiones: FilaNiveles[];
  porCiudad: FilaNiveles[];
  notaCiudad: string;
  porArea: FilaNiveles[];
  notaArea: string;
}

/** El mismo orden del backend (DistribucionNiveles.masCriticaPrimero): del nivel más alto hacia abajo. */
const masCriticaPrimero = (a: DistribucionNiveles, b: DistribucionNiveles): number => {
  for (let nivel = 5; nivel >= 1; nivel--) {
    const pa = a.niveles.find(n => n.fkNivelRiesgo === nivel)?.porcentaje ?? 0;
    const pb = b.niveles.find(n => n.fkNivelRiesgo === nivel)?.porcentaje ?? 0;
    if (pa !== pb) {
      return pb - pa;
    }
  }
  return 0;
};

const grupos = (desglose: DesgloseGrupos): FilaNiveles[] =>
  desglose.grupos.map(g => ({ nombre: g.grupo, distribucion: g.distribucion }));

/** Lo que el backend juntó u omitió por confidencialidad (grupos de menos de 2 personas). */
const notaDesglose = (desglose: DesgloseGrupos, que: string): string => {
  const partes = ['De más a menos personas.'];
  if (desglose.agrupados) {
    partes.push(`${desglose.agrupados} ${que} con menos de 2 personas se juntaron en "Otras ${que}".`);
  }
  if (desglose.omitidos) {
    partes.push(`${desglose.omitidos} persona(s) no se muestran por confidencialidad.`);
  }
  return partes.join(' ');
};

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
    SelectButtonModule,
    TabsModule,
    DistribucionCategoriasComponent,
    DistribucionNivelesComponent,
    NivelesPorGrupoComponent
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

  /** Intralaboral: el id del cuestionario de una forma, o {@link CONCENTRACION} (A y B juntas). */
  vistaIntralaboral: number | string | null = null;
  opcionesIntralaboral: { label: string; value: number | string }[] = [];
  /** Filas ya armadas de la vista elegida (se arman una vez: el gráfico se rehace si cambia la referencia). */
  intralaboral: VistaIntralaboral | null = null;
  /** Extralaboral (formas A y B juntas: el cuestionario es el mismo; cambia el baremo). */
  extralaboral: VistaExtralaboral | null = null;

  readonly CONCENTRACION = CONCENTRACION;
  readonly criterioRanking = CRITERIO_RANKING;

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
        this.prepararIntralaboral();
        this.prepararExtralaboral();
        this.cargando = false;
      },
      error: error => this.mostrarError(error)
    });
  }

  /** Opciones Forma A / Forma B / A + B; conserva la elegida si sigue existiendo en el año nuevo. */
  private prepararIntralaboral(): void {
    const formas = this.informe?.formas ?? [];
    this.opcionesIntralaboral = [
      ...formas.map(f => ({ label: `Forma ${f.forma}`, value: f.idCuestionario })),
      ...(formas.length ? [{ label: formas.length > 1 ? 'A + B' : 'Por ciudad y área', value: CONCENTRACION }] : [])
    ];
    if (!this.opcionesIntralaboral.some(o => o.value === this.vistaIntralaboral)) {
      this.vistaIntralaboral = this.opcionesIntralaboral[0]?.value ?? null;
    }
    this.cambiarVistaIntralaboral();
  }

  cambiarVistaIntralaboral(): void {
    const informe = this.informe;
    if (!informe || this.vistaIntralaboral === null) {
      this.intralaboral = null;
      return;
    }
    if (this.vistaIntralaboral === CONCENTRACION) {
      const c = informe.concentracionIntralaboral;
      this.intralaboral = {
        dominios: c.dominios.map(d => ({ nombre: d.nombre, distribucion: d.distribucion })),
        porCiudad: grupos(c.porCiudad),
        notaCiudad: notaDesglose(c.porCiudad, 'ciudades'),
        porArea: grupos(c.porArea),
        notaArea: notaDesglose(c.porArea, 'áreas')
      };
      return;
    }
    const forma = informe.formas.find(f => f.idCuestionario === this.vistaIntralaboral);
    if (!forma) {
      this.intralaboral = null;
      return;
    }
    this.intralaboral = {
      forma: forma.forma,
      personas: forma.personas,
      dominios: forma.dominios.map(d => ({ nombre: d.nombre, distribucion: d.distribucion })),
      // Todas las dimensiones de la forma, como el "Ranking de dimensiones" del Word (sort estable: en empate,
      // el orden del ranking de dominios).
      dimensiones: forma.dominios
        .flatMap(d => d.dimensiones.map(dim => ({ nombre: dim.nombre, detalle: d.nombre, distribucion: dim.distribucion })))
        .sort((a, b) => masCriticaPrimero(a.distribucion, b.distribucion)),
      fichas: forma.dominios.map(d => ({
        nombre: d.nombre,
        dimensiones: d.dimensiones.map(dim => ({ nombre: dim.nombre, distribucion: dim.distribucion }))
      }))
    };
  }

  private prepararExtralaboral(): void {
    const f = this.informe?.factoresExtralaborales;
    this.extralaboral = !f ? null : {
      dimensiones: f.dimensiones.map(d => ({ nombre: d.nombre, distribucion: d.distribucion })),
      porCiudad: grupos(f.porCiudad),
      notaCiudad: notaDesglose(f.porCiudad, 'ciudades'),
      porArea: grupos(f.porArea),
      notaArea: notaDesglose(f.porArea, 'áreas')
    };
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
