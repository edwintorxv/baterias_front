import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Sin sesión vigente → /login, recordando a dónde iba (?volver=) para llevarlo ahí al entrar. */
export const sesionGuard: CanActivateFn = (_ruta, estado) => {
    const authService = inject(AuthService);
    if (authService.sesionVigente()) {
        return true;
    }
    authService.logout();
    return inject(Router).createUrlTree(['/login'], { queryParams: { volver: estado.url } });
};

/** El login solo se muestra sin sesión: con sesión vigente va al Inicio. */
export const sinSesionGuard: CanActivateFn = () =>
    inject(AuthService).sesionVigente() ? inject(Router).createUrlTree(['/inicio']) : true;

/**
 * Solo rutas internas de la aplicación (empiezan por "/" y no por "//", que sería otro sitio): así ?volver=
 * no sirve para mandar a alguien fuera después de entrar.
 */
export const rutaInterna = (url: string | null): string | null =>
    url && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/login') ? url : null;
