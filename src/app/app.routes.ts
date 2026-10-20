import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { EnConstruccionComponent } from './pages/en-construccion/en-construccion.component';
import { InicioComponent } from './pages/inicio/inicio.component';

const enConstruccion = (path: string, titulo: string) =>
  ({ path, component: EnConstruccionComponent, data: { titulo } });

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'inicio', component: InicioComponent },

      {
        path: 'clientes',
        loadComponent: () => import('./pages/clientes/cliente-list/cliente-list.component')
          .then(m => m.ClienteListComponent)
      },
      {
        path: 'clientes/:id/personas',
        loadComponent: () => import('./pages/clientes/cliente-personas/cliente-personas.component')
          .then(m => m.ClientePersonasComponent)
      },
      {
        path: 'clientes/:id/informe',
        loadComponent: () => import('./pages/clientes/cliente-informe/cliente-informe.component')
          .then(m => m.ClienteInformeComponent)
      },
      enConstruccion('evaluados', 'Evaluados'),
      {
        path: 'aplicaciones',
        loadComponent: () => import('./pages/aplicaciones/aplicacion-list/aplicacion-list.component')
          .then(m => m.AplicacionListComponent)
      },
      {
        path: 'aplicaciones/:id',
        loadComponent: () => import('./pages/aplicaciones/aplicacion-digitar/aplicacion-digitar.component')
          .then(m => m.AplicacionDigitarComponent),
        canDeactivate: [(pagina: { hayCambios: boolean }) =>
          !pagina.hayCambios || confirm('Hay respuestas sin guardar. ¿Salir de todas formas?')]
      },

      {
        path: 'administracion/usuarios',
        loadComponent: () => import('./pages/administracion/usuario-list/usuario-list.component')
          .then(m => m.UsuarioListComponent)
      },
      {
        path: 'administracion/evaluadores',
        loadComponent: () => import('./pages/administracion/evaluador-list/evaluador-list.component')
          .then(m => m.EvaluadorListComponent)
      },

      enConstruccion('configuracion/catalogos', 'Catálogos'),
      enConstruccion('configuracion/cuestionarios', 'Cuestionarios'),

      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  },

  // CUALQUIER RUTA NO VÁLIDA
  { path: '**', redirectTo: 'inicio' }
];
