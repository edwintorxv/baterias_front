import { MenuItem } from 'primeng/api';

/**
 * Menú lateral. Por ahora todo visible (sin filtrar por rol): el backend igual aplica los permisos y
 * responde 403 si el usuario no puede. El filtro por rol se agrega al final.
 */
export const MENU: MenuItem[] = [
    {
        label: 'Inicio',
        icon: 'pi pi-home',
        routerLink: '/inicio'
    },
    {
        label: 'Trabajo',
        icon: 'pi pi-briefcase',
        expanded: true,
        items: [
            { label: 'Clientes', icon: 'pi pi-building', routerLink: '/clientes' },
            { label: 'Evaluados', icon: 'pi pi-users', routerLink: '/evaluados' },
            { label: 'Aplicaciones', icon: 'pi pi-file-edit', routerLink: '/aplicaciones' }
        ]
    },
    {
        label: 'Administración',
        icon: 'pi pi-shield',
        expanded: true,
        items: [
            { label: 'Usuarios', icon: 'pi pi-user', routerLink: '/administracion/usuarios' },
            { label: 'Evaluadores', icon: 'pi pi-id-card', routerLink: '/administracion/evaluadores' }
        ]
    },
    {
        label: 'Configuración',
        icon: 'pi pi-cog',
        items: [
            { label: 'Catálogos', icon: 'pi pi-list', routerLink: '/configuracion/catalogos' },
            { label: 'Cuestionarios', icon: 'pi pi-book', routerLink: '/configuracion/cuestionarios' }
        ]
    }
];
