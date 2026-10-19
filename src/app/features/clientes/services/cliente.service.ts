import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Cliente, ClienteRequest } from '../models/cliente.model';
import { PersonaCliente } from '../models/persona-cliente.model';

/** /clientes: ver lo pueden ADMIN y PSICOLOGO (solo sus clientes); crear y editar, solo ADMIN. */
@Injectable({
    providedIn: 'root'
})
export class ClienteService {

    private readonly url = `${environment.apiUrl}/clientes`;

    constructor(private http: HttpClient) { }

    listar(): Observable<Cliente[]> {
        return this.http.get<ApiResponse<Cliente[]>>(this.url).pipe(map(respuesta => respuesta.data));
    }

    obtener(id: number): Observable<Cliente> {
        return this.http.get<ApiResponse<Cliente>>(`${this.url}/${id}`).pipe(map(respuesta => respuesta.data));
    }

    /** Solo el psicólogo (datos de trabajadores). */
    personas(idCliente: number): Observable<PersonaCliente[]> {
        return this.http.get<ApiResponse<PersonaCliente[]>>(`${this.url}/${idCliente}/personas`)
            .pipe(map(respuesta => respuesta.data));
    }

    crear(request: ClienteRequest): Observable<ApiResponse<Cliente>> {
        return this.http.post<ApiResponse<Cliente>>(this.url, request);
    }

    actualizar(id: number, request: ClienteRequest): Observable<ApiResponse<Cliente>> {
        return this.http.put<ApiResponse<Cliente>>(`${this.url}/${id}`, request);
    }

}
