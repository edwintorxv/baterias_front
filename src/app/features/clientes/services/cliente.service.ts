import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ArchivoDescargado, comoArchivo } from '../../../core/utils/archivo.util';
import { ResultadoCarga } from '../models/carga-personas.model';
import { Cliente, ClienteRequest } from '../models/cliente.model';
import { PersonaCliente } from '../models/persona-cliente.model';
import { VinculacionResponse, VincularPersonaRequest } from '../models/vincular-persona.model';

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

    /** Vincula una persona al cliente (la crea si el documento no existe). Solo el psicólogo. */
    vincularPersona(idCliente: number, request: VincularPersonaRequest): Observable<ApiResponse<VinculacionResponse>> {
        return this.http.post<ApiResponse<VinculacionResponse>>(`${this.url}/${idCliente}/personas`, request);
    }

    /** Plantilla Excel para cargar personas: siempre vacía (nunca trae las ya cargadas). Solo el psicólogo. */
    plantillaPersonas(idCliente: number): Observable<ArchivoDescargado> {
        return this.http.get(`${this.url}/${idCliente}/personas/plantilla`, { responseType: 'blob', observe: 'response' })
            .pipe(comoArchivo('plantilla_personas.xlsx'));
    }

    /**
     * Sin confirmar: dice qué pasará con cada fila, sin guardar. Confirmando: guarda todas o ninguna
     * (409 con las filas con error en details).
     */
    cargarPersonas(idCliente: number, archivo: File, confirmar: boolean): Observable<ApiResponse<ResultadoCarga>> {
        const datos = new FormData();
        datos.append('archivo', archivo);
        return this.http.post<ApiResponse<ResultadoCarga>>(`${this.url}/${idCliente}/personas/carga`, datos,
            { params: { confirmar } });
    }

    crear(request: ClienteRequest): Observable<ApiResponse<Cliente>> {
        return this.http.post<ApiResponse<Cliente>>(this.url, request);
    }

    actualizar(id: number, request: ClienteRequest): Observable<ApiResponse<Cliente>> {
        return this.http.put<ApiResponse<Cliente>>(`${this.url}/${id}`, request);
    }

}
