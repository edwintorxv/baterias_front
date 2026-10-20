import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Evaluador, EvaluadorRequest } from '../models/evaluador.model';

/**
 * /evaluadores: ver lo pueden ADMIN y PSICOLOGO; crear y editar, solo ADMIN. La firma (ver y subir) solo
 * el propio evaluador o el ADMIN (403 si es la de otro).
 */
@Injectable({
    providedIn: 'root'
})
export class EvaluadorService {

    private readonly url = `${environment.apiUrl}/evaluadores`;

    constructor(private http: HttpClient) { }

    listar(): Observable<Evaluador[]> {
        return this.http.get<ApiResponse<Evaluador[]>>(this.url).pipe(map(respuesta => respuesta.data));
    }

    obtener(id: number): Observable<Evaluador> {
        return this.http.get<ApiResponse<Evaluador>>(`${this.url}/${id}`).pipe(map(respuesta => respuesta.data));
    }

    crear(request: EvaluadorRequest): Observable<ApiResponse<Evaluador>> {
        return this.http.post<ApiResponse<Evaluador>>(this.url, request);
    }

    actualizar(id: number, request: EvaluadorRequest): Observable<ApiResponse<Evaluador>> {
        return this.http.put<ApiResponse<Evaluador>>(`${this.url}/${id}`, request);
    }

    /** La imagen de la firma (404 si no tiene). */
    firma(id: number): Observable<Blob> {
        return this.http.get(`${this.url}/${id}/firma`, { responseType: 'blob' });
    }

    guardarFirma(id: number, archivo: File): Observable<ApiResponse<Evaluador>> {
        const datos = new FormData();
        datos.append('archivo', archivo);
        return this.http.put<ApiResponse<Evaluador>>(`${this.url}/${id}/firma`, datos);
    }

}
