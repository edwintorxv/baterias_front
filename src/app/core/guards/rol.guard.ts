import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Rol } from '../models/sesion.model';
import { AuthService } from '../services/auth.service';

/**
 * Roles que pueden ver cada pantalla: van en `data.roles` de la ruta (sin `roles` = cualquiera con sesión) y
 * repiten la tabla de permisos del backend (SecurityConfig), que es la que manda: esto solo evita pantallas a
 * medias. El CLIENTE además solo entra a las rutas de su propia empresa (`:id` = su idCliente).
 */
export const rolGuard: CanActivateFn = (ruta: ActivatedRouteSnapshot) => {
    const usuario = inject(AuthService).usuario();
    const roles = ruta.data['roles'] as Rol[] | undefined;
    const idRuta = ruta.paramMap.get('id');
    const permitido = !!usuario
        && (!roles || roles.includes(usuario.rol))
        && (usuario.rol !== 'CLIENTE' || !idRuta || Number(idRuta) === usuario.idCliente);
    if (permitido) {
        return true;
    }
    inject(MessageService).add({
        severity: 'warn', summary: 'Sin acceso', detail: 'Su usuario no tiene acceso a esa pantalla', life: 4000
    });
    return inject(Router).createUrlTree(['/inicio']);
};
