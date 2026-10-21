import { MenuItem } from 'primeng/api';
import { UsuarioSesion } from '../core/models/sesion.model';

/**
 * Menú lateral según el rol (mismas pantallas que permite rolGuard en app.routes.ts; el backend es el que
 * manda). El CLIENTE no ve el listado de clientes: va directo al informe y las estadísticas de su empresa.
 * Los evaluadores (los demás psicólogos) son solo del ADMIN: el psicólogo carga su firma en "Mi firma", desde
 * el menú de su nombre en la barra superior.
 */
export const menuPara = (usuario: UsuarioSesion | null): MenuItem[] => {
    const inicio: MenuItem = { label: 'Inicio', icon: 'pi pi-home', routerLink: '/inicio' };
    const configuracion: MenuItem = {
        label: 'Configuración',
        icon: 'pi pi-cog',
        items: [
            { label: 'Catálogos', icon: 'pi pi-list', routerLink: '/configuracion/catalogos' },
            { label: 'Cuestionarios', icon: 'pi pi-book', routerLink: '/configuracion/cuestionarios' }
        ]
    };

    switch (usuario?.rol) {
        case 'PSICOLOGO':
            return [
                inicio,
                {
                    label: 'Trabajo',
                    icon: 'pi pi-briefcase',
                    expanded: true,
                    items: [
                        { label: 'Clientes', icon: 'pi pi-building', routerLink: '/clientes' },
                        { label: 'Aplicaciones', icon: 'pi pi-file-edit', routerLink: '/aplicaciones' }
                    ]
                },
                configuracion
            ];
        case 'ADMIN':
            return [
                inicio,
                { label: 'Clientes', icon: 'pi pi-building', routerLink: '/clientes' },
                {
                    label: 'Administración',
                    icon: 'pi pi-shield',
                    expanded: true,
                    items: [
                        { label: 'Usuarios', icon: 'pi pi-user', routerLink: '/administracion/usuarios' },
                        { label: 'Evaluadores', icon: 'pi pi-id-card', routerLink: '/administracion/evaluadores' }
                    ]
                },
                configuracion
            ];
        case 'CLIENTE':
            return [
                inicio,
                ...(usuario.idCliente ? [{
                    label: 'Mi empresa',
                    icon: 'pi pi-building',
                    expanded: true,
                    items: [
                        { label: 'Informe de empresa', icon: 'pi pi-chart-bar', routerLink: ['/clientes', usuario.idCliente, 'informe'] },
                        { label: 'Estadísticas', icon: 'pi pi-chart-pie', routerLink: ['/clientes', usuario.idCliente, 'estadisticas'] }
                    ]
                }] : [])
            ];
        default:
            return [inicio];
    }
};
