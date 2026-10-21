import { Routes } from '@angular/router';
import { rolGuard } from './core/guards/rol.guard';
import { sesionGuard, sinSesionGuard } from './core/guards/sesion.guard';
import { Rol } from './core/models/sesion.model';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { EnConstruccionComponent } from './pages/en-construccion/en-construccion.component';

const enConstruccion = (path: string, titulo: string) =>
  ({ path, component: EnConstruccionComponent, data: { titulo } });

// Roles de cada pantalla (la tabla de permisos del backend; ver rolGuard).
const ADMIN_PSICOLOGO: Rol[] = ['ADMIN', 'PSICOLOGO'];
const PSICOLOGO: Rol[] = ['PSICOLOGO'];
const PSICOLOGO_CLIENTE: Rol[] = ['PSICOLOGO', 'CLIENTE'];
const ADMIN: Rol[] = ['ADMIN'];

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [sinSesionGuard]
  },
  {
    path: '',
    component: MainLayoutComponent,
    // Cada navegación revisa la sesión (el token dura 8 h; vencida → /login?volver=) y el rol (data.roles).
    canActivate: [sesionGuard],
    canActivateChild: [sesionGuard, rolGuard],
    children: [
      {
        path: 'inicio',
        loadComponent: () => import('./pages/inicio/inicio.component').then(m => m.InicioComponent)
      },

      {
        path: 'clientes',
        data: { roles: ADMIN_PSICOLOGO },
        loadComponent: () => import('./pages/clientes/cliente-list/cliente-list.component')
          .then(m => m.ClienteListComponent)
      },
      {
        path: 'clientes/:id/personas',
        data: { roles: PSICOLOGO },
        loadComponent: () => import('./pages/clientes/cliente-personas/cliente-personas.component')
          .then(m => m.ClientePersonasComponent)
      },
      {
        path: 'clientes/:id/informe',
        data: { roles: PSICOLOGO_CLIENTE },
        loadComponent: () => import('./pages/clientes/cliente-informe/cliente-informe.component')
          .then(m => m.ClienteInformeComponent)
      },
      {
        path: 'clientes/:id/estadisticas',
        data: { roles: PSICOLOGO_CLIENTE },
        loadComponent: () => import('./pages/clientes/cliente-estadisticas/cliente-estadisticas.component')
          .then(m => m.ClienteEstadisticasComponent)
      },
      {
        path: 'aplicaciones',
        data: { roles: PSICOLOGO },
        loadComponent: () => import('./pages/aplicaciones/aplicacion-list/aplicacion-list.component')
          .then(m => m.AplicacionListComponent)
      },
      {
        path: 'aplicaciones/:id',
        data: { roles: PSICOLOGO },
        loadComponent: () => import('./pages/aplicaciones/aplicacion-digitar/aplicacion-digitar.component')
          .then(m => m.AplicacionDigitarComponent),
        canDeactivate: [(pagina: { hayCambios: boolean }) =>
          !pagina.hayCambios || confirm('Hay respuestas sin guardar. ¿Salir de todas formas?')]
      },

      {
        path: 'administracion/usuarios',
        data: { roles: ADMIN },
        loadComponent: () => import('./pages/administracion/usuario-list/usuario-list.component')
          .then(m => m.UsuarioListComponent)
      },
      {
        path: 'administracion/evaluadores',
        data: { roles: ADMIN },
        loadComponent: () => import('./pages/administracion/evaluador-list/evaluador-list.component')
          .then(m => m.EvaluadorListComponent)
      },

      {
        path: 'configuracion/catalogos',
        data: { roles: ADMIN_PSICOLOGO },
        loadComponent: () => import('./pages/configuracion/catalogo-list/catalogo-list.component')
          .then(m => m.CatalogoListComponent)
      },
      {
        path: 'configuracion/cuestionarios',
        data: { roles: ADMIN_PSICOLOGO },
        loadComponent: () => import('./pages/configuracion/cuestionario-estructura/cuestionario-estructura.component')
          .then(m => m.CuestionarioEstructuraComponent)
      },

      {
        path: 'mi-firma',
        data: { roles: PSICOLOGO },
        loadComponent: () => import('./pages/perfil/mi-firma/mi-firma.component').then(m => m.MiFirmaComponent)
      },

      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  },

  // CUALQUIER RUTA NO VÁLIDA
  { path: '**', redirectTo: 'inicio' }
];
