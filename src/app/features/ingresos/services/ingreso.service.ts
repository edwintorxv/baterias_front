import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { fechaLocal } from '../../../core/utils/fecha.util';
import { ConsultaIngresos } from '../models/ingreso.model';

/** /registro-ingresos: solo ADMIN (la IP es un dato personal). Solo lectura. */
@Injectable({
    providedIn: 'root'
})
export class IngresoService {

    private readonly url = `${environment.apiUrl}/registro-ingresos`;

    constructor(private http: HttpClient) { }

    /** Los dos días incluidos. Devuelve la respuesta completa: su mensaje avisa si se cortó en 2.000 filas. 400 si desde > hasta. */
    consultar(desde: Date, hasta: Date): Observable<ApiResponse<ConsultaIngresos>> {
        return this.http.get<ApiResponse<ConsultaIngresos>>(this.url,
            { params: { desde: fechaLocal(desde), hasta: fechaLocal(hasta) } });
    }
}
