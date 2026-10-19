import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { EvaluadoCliente, EvaluadoClienteRequest } from '../models/evaluado-cliente.model';

/** /evaluado-clientes: solo el psicólogo. Crear no existe aquí: es POST /clientes/{id}/personas. */
@Injectable({
    providedIn: 'root'
})
export class EvaluadoClienteService {

    private readonly url = `${environment.apiUrl}/evaluado-clientes`;

    constructor(private http: HttpClient) { }

    obtener(id: number): Observable<EvaluadoCliente> {
        return this.http.get<ApiResponse<EvaluadoCliente>>(`${this.url}/${id}`).pipe(map(respuesta => respuesta.data));
    }

    actualizar(id: number, request: EvaluadoClienteRequest): Observable<ApiResponse<EvaluadoCliente>> {
        return this.http.put<ApiResponse<EvaluadoCliente>>(`${this.url}/${id}`, request);
    }

}
