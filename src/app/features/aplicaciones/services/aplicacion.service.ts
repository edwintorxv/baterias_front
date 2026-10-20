import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Aplicacion, AplicacionRequest } from '../models/aplicacion.model';
import { FormularioAplicacion, RespuestaDigitada } from '../models/formulario-aplicacion.model';

/** Lo que el profesional completa para el informe individual. */
export interface DatosInformeAplicacion {
    fkEvaluador: number | null;
    observaciones: string | null;
    recomendaciones: string | null;
}

/** /aplicaciones: solo el psicólogo, sobre las de sus clientes. */
@Injectable({
    providedIn: 'root'
})
export class AplicacionService {

    private readonly url = `${environment.apiUrl}/aplicaciones`;

    constructor(private http: HttpClient) { }

    /** Las de una relación persona-cliente. */
    listarPorRelacion(fkEvaluadoCliente: number): Observable<Aplicacion[]> {
        return this.http.get<ApiResponse<Aplicacion[]>>(this.url, { params: { fkEvaluadoCliente } })
            .pipe(map(respuesta => respuesta.data));
    }

    /** Sin grupo ocupacional, el backend lo toma del tipo de cargo de la relación. */
    crear(request: AplicacionRequest): Observable<ApiResponse<Aplicacion>> {
        return this.http.post<ApiResponse<Aplicacion>>(this.url, request);
    }

    formulario(id: number): Observable<FormularioAplicacion> {
        return this.http.get<ApiResponse<FormularioAplicacion>>(`${this.url}/${id}/formulario`)
            .pipe(map(respuesta => respuesta.data));
    }

    /** Si cambian y había resultados, el backend los borra (el mensaje lo dice). */
    guardarRespuestas(id: number, idCuestionario: number, respuestas: RespuestaDigitada[]):
        Observable<ApiResponse<FormularioAplicacion>> {
        return this.http.put<ApiResponse<FormularioAplicacion>>(`${this.url}/${id}/respuestas/${idCuestionario}`, { respuestas });
    }

    /** Cambia las preguntas filtro sin pisar lo demás (si cambian, el backend borra los resultados). */
    guardarFiltros(id: number, filtros: { atiendeClientes: boolean | null; esJefe: boolean | null }): Observable<ApiResponse<Aplicacion>> {
        return this.obtener(id).pipe(
            switchMap(({ id: _, ...actual }) => this.actualizar(id, { ...actual, ...filtros }))
        );
    }

    obtener(id: number): Observable<Aplicacion> {
        return this.http.get<ApiResponse<Aplicacion>>(`${this.url}/${id}`).pipe(map(respuesta => respuesta.data));
    }

    actualizar(id: number, request: AplicacionRequest): Observable<ApiResponse<Aplicacion>> {
        return this.http.put<ApiResponse<Aplicacion>>(`${this.url}/${id}`, request);
    }

    /** El PUT reemplaza la aplicación: se lee primero para no pisar lo demás y se cambian solo estos tres campos. */
    guardarDatosInforme(id: number, datos: DatosInformeAplicacion): Observable<ApiResponse<Aplicacion>> {
        return this.obtener(id).pipe(
            switchMap(({ id: _, ...actual }) => this.actualizar(id, { ...actual, ...datos }))
        );
    }

}
