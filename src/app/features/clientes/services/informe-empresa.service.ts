import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ArchivoDescargado, comoArchivo } from '../../../core/utils/archivo.util';
import { ConclusionesInforme, ConclusionesInformeRequest, InformeEmpresa } from '../models/informe-empresa.model';

/** /clientes/{id}/informe: lo ven PSICOLOGO y CLIENTE; las conclusiones solo las guarda el psicólogo. */
@Injectable({
    providedIn: 'root'
})
export class InformeEmpresaService {

    constructor(private http: HttpClient) { }

    private url(idCliente: number): string {
        return `${environment.apiUrl}/clientes/${idCliente}/informe`;
    }

    /** Años con aplicaciones, del más reciente al más antiguo. */
    anios(idCliente: number): Observable<number[]> {
        return this.http.get<ApiResponse<number[]>>(`${this.url(idCliente)}/anios`)
            .pipe(map(respuesta => respuesta.data));
    }

    consultar(idCliente: number, anio: number): Observable<InformeEmpresa> {
        return this.http.get<ApiResponse<InformeEmpresa>>(this.url(idCliente), { params: { anio } })
            .pipe(map(respuesta => respuesta.data));
    }

    conclusiones(idCliente: number, anio: number): Observable<ConclusionesInforme> {
        return this.http.get<ApiResponse<ConclusionesInforme>>(`${this.url(idCliente)}/conclusiones`, { params: { anio } })
            .pipe(map(respuesta => respuesta.data));
    }

    guardarConclusiones(idCliente: number, anio: number, request: ConclusionesInformeRequest):
        Observable<ApiResponse<ConclusionesInforme>> {
        return this.http.put<ApiResponse<ConclusionesInforme>>(`${this.url(idCliente)}/conclusiones`, request,
            { params: { anio } });
    }

    /** El Word (409 si faltan las conclusiones o el plan de acción). */
    descargarWord(idCliente: number, anio: number): Observable<ArchivoDescargado> {
        return this.http.get(`${this.url(idCliente)}/archivo`,
            { params: { anio, formato: 'docx' }, responseType: 'blob', observe: 'response' })
            .pipe(comoArchivo(`informe_empresa_${anio}.docx`));
    }

}
