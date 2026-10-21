import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, Signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { forkJoin, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/api-response.model';
import { NOMBRE_ROL, UsuarioSesion } from '../../core/models/sesion.model';
import { AuthService } from '../../core/services/auth.service';
import { ResponseHandlerUtil } from '../../core/utils/response-handler.util';
import { AplicacionListado } from '../../features/aplicaciones/models/aplicacion-listado.model';
import { ESTADO_APLICACION, EstadoAplicacion } from '../../features/aplicaciones/models/formulario-aplicacion.model';
import { AplicacionService } from '../../features/aplicaciones/services/aplicacion.service';
import { Cliente } from '../../features/clientes/models/cliente.model';
import { ClienteService } from '../../features/clientes/services/cliente.service';
import { EvaluadorService } from '../../features/evaluadores/services/evaluador.service';
import { UsuarioService } from '../../features/usuarios/services/usuario.service';

/** Orden de las tarjetas: de lo que falta por hacer a lo terminado. */
const ORDEN_ESTADOS: EstadoAplicacion[] = ['SIN_RESPUESTAS', 'INCOMPLETA', 'PENDIENTE_CALCULO', 'CALCULADA'];

/** Cuántas aplicaciones sin terminar se muestran en "Para continuar". */
const MAXIMO_PARA_CONTINUAR = 8;

interface AplicacionInicio extends AplicacionListado {
  anio: number;
  avance: number;
}

/** Algo de la configuración que impide trabajar o firmar, con los nombres afectados. */
interface AvisoAdmin {
  texto: string;
  nombres: string[];
  enlace: string;
  accion: string;
}

/** Cuántos nombres se listan en un aviso antes de "y n más". */
const MAXIMO_NOMBRES = 5;

interface ClienteInicio {
  id: number;
  nombre: string;
  nit: string;
  aplicaciones: number;
  calculadas: number;
  sinTerminar: number;
}

/**
 * Inicio según el rol, con contadores de trabajo y accesos directos: sin niveles de riesgo ni datos de varias
 * empresas mezclados (las estadísticas van dentro de cada cliente, decisión del usuario). El psicólogo ve sus
 * aplicaciones del año por estado, las que están sin terminar y sus clientes; el administrador y el cliente,
 * accesos directos. La sesión y la prueba de conexión solo se muestran en desarrollo.
 */
@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    MessageModule,
    ProgressBarModule,
    SelectModule,
    TagModule
  ],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.scss'
})
export class InicioComponent {

  readonly nombreRol = NOMBRE_ROL;
  readonly estados = ESTADO_APLICACION;
  readonly ordenEstados = ORDEN_ESTADOS;
  readonly desarrollo = !environment.production;
  readonly apiUrl = environment.apiUrl;
  readonly hoy = new Date();

  usuario: Signal<UsuarioSesion | null>;
  rol: Signal<string | null>;

  // Psicólogo
  private aplicaciones: AplicacionInicio[] = [];
  private clientes: Cliente[] = [];
  opcionesAnio: number[] = [];
  anio: number | null = null;
  conteo: Record<EstadoAplicacion, number> = { SIN_RESPUESTAS: 0, INCOMPLETA: 0, PENDIENTE_CALCULO: 0, CALCULADA: 0 };
  paraContinuar: AplicacionInicio[] = [];
  sinTerminarDelAnio = 0;
  misClientes: ClienteInicio[] = [];
  /** null mientras no se sabe (o el psicólogo no tiene evaluador). */
  sinFirma: boolean | null = null;
  cargando = false;

  // Administrador
  contadores: { etiqueta: string; valor: number; enlace: string }[] = [];
  avisos: AvisoAdmin[] = [];
  cargandoAdmin = false;
  readonly maximoNombres = MAXIMO_NOMBRES;

  // Desarrollo
  estadoConexion: 'cargando' | 'ok' | 'error' = 'cargando';
  mensajeError = '';

  constructor(
    private http: HttpClient,
    private aplicacionService: AplicacionService,
    private clienteService: ClienteService,
    private evaluadorService: EvaluadorService,
    private usuarioService: UsuarioService,
    private messageService: MessageService,
    authService: AuthService
  ) {
    this.usuario = authService.usuario;
    this.rol = computed(() => authService.usuario()?.rol ?? null);
    // Se recarga al cambiar de usuario de prueba.
    effect(() => {
      const usuario = this.usuario();
      if (usuario?.rol === 'PSICOLOGO') {
        this.cargarPsicologo(usuario);
      }
      if (usuario?.rol === 'ADMIN') {
        this.cargarAdmin();
      }
      if (this.desarrollo && usuario) {
        this.probarConexion();
      }
    });
  }

  get saludo(): string {
    const hora = this.hoy.getHours();
    return hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  }

  get primerNombre(): string {
    return this.usuario()?.nombre.trim().split(/\s+/)[0] ?? '';
  }

  cambiarAnio(): void {
    this.resumirAnio();
  }

  private cargarPsicologo(usuario: UsuarioSesion): void {
    this.cargando = true;
    this.sinFirma = null;
    if (usuario.idEvaluador) {
      this.evaluadorService.obtener(usuario.idEvaluador).subscribe({
        next: evaluador => this.sinFirma = !evaluador.tieneFirma,
        error: () => this.sinFirma = null
      });
    }
    this.clienteService.listar().subscribe({
      next: clientes => {
        this.clientes = clientes;
        this.resumirAnio();
      },
      error: error => ResponseHandlerUtil.handleError(error, this.messageService)
    });
    this.aplicacionService.listado().subscribe({
      next: aplicaciones => {
        this.cargando = false;
        this.aplicaciones = aplicaciones.map(a => ({
          ...a,
          anio: Number(a.fechaAplicacion.substring(0, 4)),
          avance: a.aplicables ? Math.floor(a.respondidas * 100 / a.aplicables) : 0
        }));
        const actual = this.hoy.getFullYear();
        this.opcionesAnio = [...new Set([actual, ...this.aplicaciones.map(a => a.anio)])].sort((a, b) => b - a);
        if (!this.anio || !this.opcionesAnio.includes(this.anio)) {
          this.anio = actual;
        }
        this.resumirAnio();
      },
      error: error => {
        this.cargando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  /** Tarjetas por estado, "Para continuar" y la fila de cada cliente, del año elegido. */
  private resumirAnio(): void {
    const delAnio = this.aplicaciones.filter(a => a.anio === this.anio);
    ORDEN_ESTADOS.forEach(e => this.conteo[e] = delAnio.filter(a => a.estado === e).length);

    const sinTerminar = delAnio.filter(a => a.estado !== 'CALCULADA');
    this.sinTerminarDelAnio = sinTerminar.length;
    // Lo más reciente primero: es lo que se estaba digitando.
    this.paraContinuar = [...sinTerminar]
      .sort((a, b) => b.fechaAplicacion.localeCompare(a.fechaAplicacion) || b.id - a.id)
      .slice(0, MAXIMO_PARA_CONTINUAR);

    this.misClientes = this.clientes
      .map(c => {
        const delCliente = delAnio.filter(a => a.idCliente === c.id);
        const calculadas = delCliente.filter(a => a.estado === 'CALCULADA').length;
        return {
          id: c.id,
          nombre: c.nombre,
          nit: c.nit,
          aplicaciones: delCliente.length,
          calculadas,
          sinTerminar: delCliente.length - calculadas
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  /**
   * Contadores y avisos de configuración: evaluadores activos sin firma o sin usuario, psicólogos sin clientes
   * y clientes sin psicólogo (solo usuarios activos). Los clientes de cada psicólogo salen de
   * GET /usuarios/{id}/clientes, como en la pantalla de Usuarios.
   */
  private cargarAdmin(): void {
    this.cargandoAdmin = true;
    forkJoin({
      usuarios: this.usuarioService.listar(),
      evaluadores: this.evaluadorService.listar(),
      clientes: this.clienteService.listar()
    }).subscribe({
      next: ({ usuarios, evaluadores, clientes }) => {
        const activos = usuarios.filter(u => u.activo);
        const psicologos = activos.filter(u => u.rol === 'PSICOLOGO');
        const evaluadoresActivos = evaluadores.filter(e => e.activo);
        (psicologos.length
          ? forkJoin(psicologos.map(u => this.usuarioService.clientes(u.id).pipe(map(ids => [u, ids] as const))))
          : of([])
        ).subscribe({
          next: asignaciones => {
            this.cargandoAdmin = false;
            const conCliente = new Set(asignaciones.flatMap(([, ids]) => ids));
            const conUsuario = new Set(psicologos.map(u => u.idEvaluador));
            const ordenar = (nombres: string[]) => nombres.sort((a, b) => a.localeCompare(b, 'es'));

            this.contadores = [
              { etiqueta: 'Clientes', valor: clientes.length, enlace: '/clientes' },
              { etiqueta: 'Psicólogos activos', valor: psicologos.length, enlace: '/administracion/usuarios' },
              { etiqueta: 'Usuarios de clientes', valor: activos.filter(u => u.rol === 'CLIENTE').length, enlace: '/administracion/usuarios' },
              { etiqueta: 'Evaluadores activos', valor: evaluadoresActivos.length, enlace: '/administracion/evaluadores' }
            ];
            this.avisos = [
              {
                texto: 'Evaluadores activos sin firma: sus informes salen sin ella',
                nombres: ordenar(evaluadoresActivos.filter(e => !e.tieneFirma).map(e => e.nombre)),
                enlace: '/administracion/evaluadores', accion: 'Ir a Evaluadores'
              },
              {
                texto: 'Evaluadores activos sin usuario: no pueden entrar a trabajar',
                nombres: ordenar(evaluadoresActivos.filter(e => !conUsuario.has(e.id)).map(e => e.nombre)),
                enlace: '/administracion/usuarios', accion: 'Ir a Usuarios'
              },
              {
                texto: 'Psicólogos sin clientes asignados: no ven ninguna empresa',
                nombres: ordenar(asignaciones.filter(([, ids]) => !ids.length).map(([u]) => u.nombre)),
                enlace: '/administracion/usuarios', accion: 'Ir a Usuarios'
              },
              {
                texto: 'Clientes sin psicólogo asignado: nadie puede trabajar con ellos',
                nombres: ordenar(clientes.filter(c => !conCliente.has(c.id)).map(c => c.nombre)),
                enlace: '/administracion/usuarios', accion: 'Ir a Usuarios'
              }
            ].filter(aviso => aviso.nombres.length);
          },
          error: error => this.falloAdmin(error)
        });
      },
      error: error => this.falloAdmin(error)
    });
  }

  private falloAdmin(error: HttpErrorResponse): void {
    this.cargandoAdmin = false;
    ResponseHandlerUtil.handleError(error, this.messageService);
  }

  private probarConexion(): void {
    this.estadoConexion = 'cargando';
    this.http.get<ApiResponse<UsuarioSesion>>(`${environment.apiUrl}/auth/yo`).subscribe({
      next: () => this.estadoConexion = 'ok',
      error: (error: HttpErrorResponse) => {
        this.estadoConexion = 'error';
        this.mensajeError = ResponseHandlerUtil.describir(error).detalle;
      }
    });
  }

}
