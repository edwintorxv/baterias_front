import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Evaluador } from '../models/evaluador.model';

/** /evaluadores: ver lo pueden ADMIN y PSICOLOGO; crear y editar, solo ADMIN. */
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

}
