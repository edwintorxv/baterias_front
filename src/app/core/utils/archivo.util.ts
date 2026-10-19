import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, catchError, from, map, switchMap, throwError } from 'rxjs';

/** Archivo descargado con el nombre que manda el backend en Content-Disposition. */
export interface ArchivoDescargado {
    blob: Blob;
    nombre: string;
}

/**
 * Para peticiones con responseType 'blob' y observe 'response': arma el archivo con su nombre y, si
 * falla, convierte el ApiError (que llega como Blob) para que el mensaje se muestre igual que siempre.
 */
export function comoArchivo(porDefecto: string) {
    return (respuesta$: Observable<HttpResponse<Blob>>): Observable<ArchivoDescargado> => respuesta$.pipe(
        map(respuesta => ({ blob: respuesta.body as Blob, nombre: nombreArchivo(respuesta, porDefecto) })),
        catchError(error => errorConApiError(error))
    );
}

/** Lo guarda en el equipo del usuario (descarga del navegador). */
export function guardarArchivo({ blob, nombre }: ArchivoDescargado): void {
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = nombre;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(enlace.href));
}

function nombreArchivo(respuesta: HttpResponse<Blob>, porDefecto: string): string {
    const disposicion = respuesta.headers.get('Content-Disposition') ?? '';
    const nombre = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposicion)?.[1];
    return nombre ? decodeURIComponent(nombre) : porDefecto;
}

function errorConApiError(error: HttpErrorResponse): Observable<never> {
    if (!(error.error instanceof Blob)) {
        return throwError(() => error);
    }
    return from(error.error.text()).pipe(
        switchMap(texto => {
            let cuerpo: unknown = null;
            try {
                cuerpo = JSON.parse(texto);
            } catch {
                // Sin cuerpo JSON: se deja el mensaje por defecto del código HTTP.
            }
            return throwError(() => new HttpErrorResponse({
                error: cuerpo,
                headers: error.headers,
                status: error.status,
                statusText: error.statusText,
                url: error.url ?? undefined
            }));
        })
    );
}
