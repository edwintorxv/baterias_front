import { Component, Signal, computed, effect } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ListboxModule } from 'primeng/listbox';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { Observable, forkJoin, map } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { Catalogo } from '../../../shared/models/catalogo.model';

/** Una fila de cualquier catálogo: id, nombre y las columnas propias de ese catálogo. */
type Fila = { id: number; nombre: string } & Record<string, string | number>;

interface Columna {
  campo: string;
  titulo: string;
}

interface DefinicionCatalogo {
  clave: string;
  nombre: string;
  /** Lo que explica el catálogo bajo el título (opcional). */
  ayuda?: string;
  columnas: Columna[];
  cargar: () => Observable<Fila[]>;
}

interface GrupoCatalogos {
  label: string;
  items: DefinicionCatalogo[];
}

const normalizar = (texto: string | number | null | undefined) =>
  String(texto ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const FORMA_POR_GRUPO: Record<number, string> = { 1: 'A', 2: 'B' };

/**
 * Catálogos en solo lectura (ADMIN y PSICOLOGO). Son datos maestros: si alguno cambia, va en una migración
 * del backend, no desde aquí. Se elige el catálogo a la izquierda y se busca en la tabla de la derecha.
 */
@Component({
  selector: 'app-catalogo-list',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    ListboxModule,
    MessageModule,
    TableModule
  ],
  templateUrl: './catalogo-list.component.html',
  styleUrl: './catalogo-list.component.scss'
})
export class CatalogoListComponent {

  readonly grupos: GrupoCatalogos[];

  catalogo: DefinicionCatalogo;
  searchControl = new FormControl('', { nonNullable: true });

  private filasOriginal: Fila[] = [];
  lstFilas: Fila[] = [];
  cargando = false;

  puedeVer: Signal<boolean>;

  constructor(
    private catalogoService: CatalogoService,
    private messageService: MessageService,
    authService: AuthService
  ) {
    this.grupos = this.definirGrupos();
    this.catalogo = this.grupos[0].items[0];
    this.puedeVer = computed(() => ['ADMIN', 'PSICOLOGO'].includes(authService.usuario()?.rol ?? ''));
    this.searchControl.valueChanges.subscribe(() => this.filtrar());
    // Se recarga al cambiar de usuario de prueba.
    effect(() => {
      if (this.puedeVer()) {
        this.cargar();
      } else {
        this.filasOriginal = [];
        this.filtrar();
      }
    });
  }

  /** Al elegir otro catálogo se limpia la búsqueda (el listbox no deja quedar sin selección). */
  seleccionar(catalogo: DefinicionCatalogo | null): void {
    if (!catalogo) {
      return;
    }
    this.catalogo = catalogo;
    this.searchControl.setValue('', { emitEvent: false });
    this.cargar();
  }

  cargar(): void {
    const catalogo = this.catalogo;
    this.cargando = true;
    catalogo.cargar().subscribe({
      next: filas => {
        if (catalogo !== this.catalogo) {
          return; // se eligió otro mientras cargaba
        }
        this.filasOriginal = filas;
        this.filtrar();
        this.cargando = false;
      },
      error: error => {
        this.filasOriginal = [];
        this.filtrar();
        this.cargando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  /** Por nombre o cualquiera de las columnas del catálogo, sin distinguir tildes ni mayúsculas. */
  filtrar(): void {
    const termino = normalizar(this.searchControl.value.trim());
    const campos = ['id', 'nombre', ...this.catalogo.columnas.map(c => c.campo)];
    this.lstFilas = !termino
      ? this.filasOriginal
      : this.filasOriginal.filter(fila => campos.some(campo => normalizar(fila[campo]).includes(termino)));
  }

  private definirGrupos(): GrupoCatalogos[] {
    const s = this.catalogoService;
    const simple = (clave: string, nombre: string, fuente: () => Observable<Catalogo[]>,
                    ayuda?: string): DefinicionCatalogo =>
      ({ clave, nombre, ayuda, columnas: [], cargar: () => fuente().pipe(map(lista => lista.map(c => ({ ...c })))) });

    return [
      {
        label: 'Ficha de datos generales',
        items: [
          simple('sexos', 'Sexo', () => s.sexos()),
          simple('estados-civiles', 'Estado civil', () => s.estadosCiviles()),
          simple('niveles-academicos', 'Nivel académico', () => s.nivelesAcademicos()),
          simple('estratos', 'Estrato socioeconómico', () => s.estratos()),
          simple('tipos-vivienda', 'Tipo de vivienda', () => s.tiposVivienda()),
          {
            clave: 'tipos-cargo',
            nombre: 'Tipo de cargo',
            ayuda: 'La forma que corresponde según el grupo ocupacional; el psicólogo la confirma al crear la aplicación.',
            columnas: [{ campo: 'forma', titulo: 'Forma' }],
            cargar: () => s.tiposCargo().pipe(map(lista => lista.map(t =>
              ({ id: t.id, nombre: t.nombre, forma: FORMA_POR_GRUPO[t.fkGrupoOcupacional] ?? '' }))))
          },
          simple('tiempos-cargo', 'Tiempo en el cargo', () => s.tiemposCargo()),
          simple('tipos-contrato', 'Tipo de contrato', () => s.tiposContrato()),
          simple('horas-labor', 'Horas de trabajo diarias', () => s.horasLabor()),
          simple('tipos-salario', 'Tipo de salario', () => s.tiposSalario())
        ]
      },
      {
        label: 'Ubicación',
        items: [
          {
            clave: 'departamentos',
            nombre: 'Departamentos',
            columnas: [{ campo: 'codigoDane', titulo: 'Código DANE' }],
            cargar: () => s.departamentos().pipe(map(lista => lista.map(d =>
              ({ id: d.id, nombre: d.nombre, codigoDane: d.codigoDane ?? '' }))))
          },
          {
            clave: 'ciudades',
            nombre: 'Ciudades y municipios',
            columnas: [{ campo: 'departamento', titulo: 'Departamento' }, { campo: 'codigoDane', titulo: 'Código DANE' }],
            cargar: () => forkJoin([s.ciudades(), s.departamentos()]).pipe(map(([ciudades, departamentos]) => {
              const nombres = new Map(departamentos.map(d => [d.id, d.nombre]));
              return ciudades.map(c => ({
                id: c.id, nombre: c.nombre, departamento: nombres.get(c.fkDepartamento) ?? '', codigoDane: c.codigoDane ?? ''
              }));
            }))
          }
        ]
      },
      {
        label: 'Empresas',
        items: [
          simple('sectores', 'Sectores económicos', () => s.sectoresEconomicos()),
          {
            clave: 'industrias',
            nombre: 'Industrias',
            columnas: [{ campo: 'sector', titulo: 'Sector económico' }],
            cargar: () => forkJoin([s.industrias(), s.sectoresEconomicos()]).pipe(map(([industrias, sectores]) => {
              const nombres = new Map(sectores.map(x => [x.id, x.nombre]));
              return industrias.map(i => ({ id: i.id, nombre: i.nombre, sector: nombres.get(i.fkSectorEconomico) ?? '' }));
            }))
          }
        ]
      },
      {
        label: 'Batería',
        items: [
          simple('grupos-ocupacionales', 'Grupos ocupacionales', () => s.gruposOcupacionales(),
            'Grupo 1 → forma A del cuestionario intralaboral; grupo 2 → forma B. De él dependen los baremos.'),
          simple('niveles-riesgo', 'Niveles de riesgo', () => s.nivelesRiesgo(),
            'En los síntomas de estrés se muestran como Muy bajo, Bajo, Medio, Alto y Muy alto.')
        ]
      }
    ];
  }

}
