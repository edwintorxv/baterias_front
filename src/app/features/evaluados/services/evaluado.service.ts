import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Evaluado, EvaluadoRequest } from '../models/evaluado.model';

/** /evaluados: solo el psicólogo. Crear no existe aquí: se crea al vincular la persona a un cliente. */
@Injectable({
    providedIn: 'root'
})
export class EvaluadoService {

    private readonly url = `${environment.apiUrl}/evaluados`;

    constructor(private http: HttpClient) { }

    obtener(id: number): Observable<Evaluado> {
        return this.http.get<ApiResponse<Evaluado>>(`${this.url}/${id}`).pipe(map(respuesta => respuesta.data));
    }

    actualizar(id: number, request: EvaluadoRequest): Observable<ApiResponse<Evaluado>> {
        return this.http.put<ApiResponse<Evaluado>>(`${this.url}/${id}`, request);
    }

}
