import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { ApiError, ApiResponse } from '../models/api-response.model';

/** Mensajes (toast) a partir de ApiResponse / ApiError del backend. */
export class ResponseHandlerUtil {

    static handleResponse(response: ApiResponse<unknown>, messageService: MessageService): void {
        messageService.add({
            severity: 'success',
            summary: 'Listo',
            detail: response.message,
            life: 4000
        });
    }

    /** El 401 no se avisa: el interceptor ya cierra la sesión y lleva al login (o reingresa en desarrollo). */
    static handleError(error: HttpErrorResponse, messageService: MessageService): void {
        if (error.status === 401) {
            return;
        }
        const { titulo, detalle } = ResponseHandlerUtil.describir(error);
        messageService.add({
            severity: error.status === 409 || error.status === 400 ? 'warn' : 'error',
            summary: titulo,
            detail: detalle,
            life: 6000
        });
    }

    /** Título según el código HTTP; el detalle es el mensaje del backend (+ detalles de validación). */
    static describir(error: HttpErrorResponse): { titulo: string; detalle: string } {
        const apiError = error.error as ApiError | null;
        const mensaje = apiError?.message;
        const detalles = apiError?.details?.length ? `: ${apiError.details.join('; ')}` : '';

        switch (error.status) {
            case 0:
                return { titulo: 'Sin conexión', detalle: 'No se pudo conectar con el servidor' };
            case 400:
                return { titulo: 'Datos inválidos', detalle: (mensaje ?? 'Revise los datos') + detalles };
            case 401:
                return { titulo: 'Sesión', detalle: mensaje ?? 'Debe iniciar sesión' };
            case 403:
                return { titulo: 'Sin permiso', detalle: mensaje ?? 'No tiene permiso para esta operación' };
            case 404:
                return { titulo: 'No encontrado', detalle: mensaje ?? 'El recurso no existe' };
            case 409:
                return { titulo: 'No se puede completar', detalle: mensaje ?? 'Conflicto con los datos' };
            case 429:
                return { titulo: 'Demasiados intentos', detalle: mensaje ?? 'Intente más tarde' };
            default:
                return { titulo: 'Error', detalle: mensaje ?? 'Ocurrió un error en el servidor' };
        }
    }

}
