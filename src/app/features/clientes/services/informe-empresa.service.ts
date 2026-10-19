import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, from, map, switchMap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ConclusionesInforme, ConclusionesInformeRequest, InformeEmpresa } from '../models/informe-empresa.model';

/** Archivo descargado con el nombre que manda el backend en Content-Disposition. */
export interface ArchivoDescargado {
    blob: Blob;
    nombre: string;
}

/** /clientes/{id}/informe: lo ven PSICOLOGO y CLIENTE; las conclusiones solo las guarda el psicólogo. */
@Injectable({
    providedIn: 'root'
})
export class InformeEmpresaService {

    constructor(private http: HttpClient) { }

    private url(idCliente: number): string {
        return `${environment.apiUrl}/clientes/${idCliente}/informe`;
    }

    /** Años con aplicaciones, del más reciente al más antiguo. */
    anios(idCliente: number): Observable<number[]> {
        return this.http.get<ApiResponse<number[]>>(`${this.url(idCliente)}/anios`)
            .pipe(map(respuesta => respuesta.data));
    }

    consultar(idCliente: number, anio: number): Observable<InformeEmpresa> {
        return this.http.get<ApiResponse<InformeEmpresa>>(this.url(idCliente), { params: { anio } })
            .pipe(map(respuesta => respuesta.data));
    }

    conclusiones(idCliente: number, anio: number): Observable<ConclusionesInforme> {
        return this.http.get<ApiResponse<ConclusionesInforme>>(`${this.url(idCliente)}/conclusiones`, { params: { anio } })
            .pipe(map(respuesta => respuesta.data));
    }

    guardarConclusiones(idCliente: number, anio: number, request: ConclusionesInformeRequest):
        Observable<ApiResponse<ConclusionesInforme>> {
        return this.http.put<ApiResponse<ConclusionesInforme>>(`${this.url(idCliente)}/conclusiones`, request,
            { params: { anio } });
    }

    /** El Word (409 si faltan las conclusiones o el plan de acción). */
    descargarWord(idCliente: number, anio: number): Observable<ArchivoDescargado> {
        return this.http.get(`${this.url(idCliente)}/archivo`,
            { params: { anio, formato: 'docx' }, responseType: 'blob', observe: 'response' }).pipe(
                map(respuesta => ({
                    blob: respuesta.body as Blob,
                    nombre: nombreArchivo(respuesta, `informe_empresa_${anio}.docx`)
                })),
                catchError(error => errorConApiError(error))
            );
    }

}

function nombreArchivo(respuesta: HttpResponse<Blob>, porDefecto: string): string {
    const disposicion = respuesta.headers.get('Content-Disposition') ?? '';
    const nombre = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposicion)?.[1];
    return nombre ? decodeURIComponent(nombre) : porDefecto;
}

/** Con responseType 'blob' el ApiError llega como Blob: se lee como JSON para que el mensaje se muestre igual. */
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
