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
      enConstruccion('evaluados', 'Evaluados'),
      enConstruccion('aplicaciones', 'Aplicaciones'),

      enConstruccion('administracion/usuarios', 'Usuarios'),
      enConstruccion('administracion/evaluadores', 'Evaluadores'),

      enConstruccion('configuracion/catalogos', 'Catálogos'),
      enConstruccion('configuracion/cuestionarios', 'Cuestionarios'),

      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  },

  // CUALQUIER RUTA NO VÁLIDA
  { path: '**', redirectTo: 'inicio' }
];
