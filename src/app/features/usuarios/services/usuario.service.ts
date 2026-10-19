import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Usuario } from '../models/usuario.model';

/** /usuarios: solo ADMIN. */
@Injectable({
    providedIn: 'root'
})
export class UsuarioService {

    private readonly url = `${environment.apiUrl}/usuarios`;

    constructor(private http: HttpClient) { }

    listar(): Observable<Usuario[]> {
        return this.http.get<ApiResponse<Usuario[]>>(this.url).pipe(map(respuesta => respuesta.data));
    }

    /** Ids de los clientes que ve el psicólogo. */
    clientes(idUsuario: number): Observable<number[]> {
        return this.http.get<ApiResponse<number[]>>(`${this.url}/${idUsuario}/clientes`).pipe(map(respuesta => respuesta.data));
    }

    /** Reemplaza la lista completa (vacía = ninguno). Solo usuarios con rol PSICOLOGO. */
    asignarClientes(idUsuario: number, idsCliente: number[]): Observable<ApiResponse<number[]>> {
        return this.http.put<ApiResponse<number[]>>(`${this.url}/${idUsuario}/clientes`, { idsCliente });
    }

}
