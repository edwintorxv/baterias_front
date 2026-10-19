import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Catalogo, CiudadMunicipio, Departamento, Industria } from '../../shared/models/catalogo.model';
import { ApiResponse } from '../models/api-response.model';

/**
 * Catálogos de solo lectura para formularios y tablas. Se piden una vez por sesión del navegador y se
 * comparten (no cambian mientras se trabaja; si fallan, el siguiente intento vuelve a pedirlos).
 */
@Injectable({
    providedIn: 'root'
})
export class CatalogoService {

    private readonly cache = new Map<string, Observable<unknown>>();

    constructor(private http: HttpClient) { }

    departamentos(): Observable<Departamento[]> {
        return this.listar<Departamento>('departamentos');
    }

    /** Todas las ciudades (~1.100): para mostrar nombres y filtrar por departamento sin ir al servidor. */
    ciudades(): Observable<CiudadMunicipio[]> {
        return this.listar<CiudadMunicipio>('ciudades-municipios');
    }

    sectoresEconomicos(): Observable<Catalogo[]> {
        return this.listar<Catalogo>('sectores-economicos');
    }

    /** Todas las industrias, cada una con su sector: se filtran por sector en el front (como las ciudades). */
    industrias(): Observable<Industria[]> {
        return this.listar<Industria>('industrias');
    }

    private listar<T>(ruta: string): Observable<T[]> {
        if (!this.cache.has(ruta)) {
            const peticion = this.http.get<ApiResponse<T[]>>(`${environment.apiUrl}/${ruta}`).pipe(
                map(respuesta => [...respuesta.data].sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, 'es'))),
                shareReplay({ bufferSize: 1, refCount: false })
            );
            this.cache.set(ruta, peticion);
            peticion.subscribe({ error: () => this.cache.delete(ruta) });
        }
        return this.cache.get(ruta) as Observable<T[]>;
    }

}
