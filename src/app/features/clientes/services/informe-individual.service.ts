import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ArchivoDescargado, comoArchivo } from '../../../core/utils/archivo.util';
import { InformeIndividual } from '../models/informe-individual.model';

export type FormatoInforme = 'pdf' | 'docx';

/** /clientes/{id}/evaluados/{idEvaluado}/informe: solo el psicólogo asignado al cliente. */
@Injectable({
    providedIn: 'root'
})
export class InformeIndividualService {

    constructor(private http: HttpClient) { }

    private url(idCliente: number, idEvaluado: number): string {
        return `${environment.apiUrl}/clientes/${idCliente}/evaluados/${idEvaluado}/informe`;
    }

    /** Años con aplicaciones de la persona en este cliente (404 si no tiene ninguna). */
    anios(idCliente: number, idEvaluado: number): Observable<number[]> {
        return this.http.get<ApiResponse<number[]>>(`${this.url(idCliente, idEvaluado)}/anios`)
            .pipe(map(respuesta => respuesta.data));
    }

    consultar(idCliente: number, idEvaluado: number, anio: number): Observable<InformeIndividual> {
        return this.http.get<ApiResponse<InformeIndividual>>(this.url(idCliente, idEvaluado), { params: { anio } })
            .pipe(map(respuesta => respuesta.data));
    }

    /** El archivo del año (409 si alguna aplicación no tiene evaluador, firma o resultados). */
    descargar(idCliente: number, idEvaluado: number, anio: number, formato: FormatoInforme): Observable<ArchivoDescargado> {
        return this.http.get(`${this.url(idCliente, idEvaluado)}/archivo`,
            { params: { anio, formato }, responseType: 'blob', observe: 'response' })
            .pipe(comoArchivo(`informe_${idEvaluado}_${anio}.${formato}`));
    }

}
