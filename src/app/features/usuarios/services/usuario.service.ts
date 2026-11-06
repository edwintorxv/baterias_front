import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Usuario, UsuarioCrearRequest, UsuarioRequest } from '../models/usuario.model';

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

    crear(request: UsuarioCrearRequest): Observable<ApiResponse<Usuario>> {
        return this.http.post<ApiResponse<Usuario>>(this.url, request);
    }

    /** 409 si se cambia el rol o se inactiva a sí mismo, o si dejaría sin administradores activos. */
    actualizar(id: number, request: UsuarioRequest): Observable<ApiResponse<Usuario>> {
        return this.http.put<ApiResponse<Usuario>>(`${this.url}/${id}`, request);
    }

    /**
     * Envía al usuario por correo el enlace para definir su contraseña (vence a las 48 h, un solo uso). Desde ya
     * su contraseña anterior deja de servir y sus sesiones se cierran. La respuesta no trae el enlace.
     * 409 si el usuario está inactivo o es uno mismo.
     */
    generarEnlaceContrasena(id: number): Observable<ApiResponse<Usuario>> {
        return this.http.post<ApiResponse<Usuario>>(`${this.url}/${id}/enlace-contrasena`, null);
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
