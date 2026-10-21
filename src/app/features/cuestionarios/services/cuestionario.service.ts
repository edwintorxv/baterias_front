import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Cuestionario, EstructuraCuestionario, TotalGeneral } from '../models/estructura-cuestionario.model';

/**
 * Configuración de los cuestionarios en solo lectura (ADMIN y PSICOLOGO). No cambia mientras se trabaja: cada
 * consulta se pide una vez por sesión del navegador (si falla, el siguiente intento vuelve a pedirla).
 */
@Injectable({
    providedIn: 'root'
})
export class CuestionarioService {

    private readonly url = `${environment.apiUrl}/cuestionarios`;
    private readonly cache = new Map<string, Observable<unknown>>();

    constructor(private http: HttpClient) { }

    /** Ordenados por forma (A, B, C, D). */
    listar(): Observable<Cuestionario[]> {
        return this.consultar<Cuestionario[]>(this.url).pipe(
            map(lista => [...lista].sort((a, b) => a.forma.localeCompare(b.forma))));
    }

    estructura(id: number): Observable<EstructuraCuestionario> {
        return this.consultar<EstructuraCuestionario>(`${this.url}/${id}/estructura`);
    }

    totalGeneral(): Observable<TotalGeneral[]> {
        return this.consultar<TotalGeneral[]>(`${this.url}/total-general`);
    }

    private consultar<T>(url: string): Observable<T> {
        if (!this.cache.has(url)) {
            const peticion = this.http.get<ApiResponse<T>>(url).pipe(
                map(respuesta => respuesta.data),
                shareReplay({ bufferSize: 1, refCount: false })
            );
            this.cache.set(url, peticion);
            peticion.subscribe({ error: () => this.cache.delete(url) });
        }
        return this.cache.get(url) as Observable<T>;
    }

}
