import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ResponseHandlerUtil } from '../utils/response-handler.util';

const conToken = (req: HttpRequest<unknown>, token: string | null) =>
    token ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) }) : req;

/**
 * Pone el token en cada petición. Con 401 (token vencido o usuario desactivado): en desarrollo vuelve
 * a entrar con el usuario de prueba y repite la petición una vez; si no, cierra la sesión.
 * 403 y "sin conexión" se avisan aquí; el resto de errores los maneja cada pantalla.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {

    const authService = inject(AuthService);
    const messageService = inject(MessageService);
    const esLogin = req.url.endsWith('/auth/login');

    return next(conToken(req, authService.token())).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && !esLogin) {
                const reingreso = authService.reingresar();
                if (reingreso) {
                    return reingreso.pipe(switchMap(() => next(conToken(req, authService.token()))));
                }
                authService.logout();
            }
            if (error.status === 403 || error.status === 0) {
                ResponseHandlerUtil.handleError(error, messageService);
            }
            return throwError(() => error);
        })
    );
};
