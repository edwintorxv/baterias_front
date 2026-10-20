import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Catalogo } from '../../shared/models/catalogo.model';
import { CiudadMunicipio } from '../../shared/models/ciudad-municipio.model';
import { Departamento } from '../../shared/models/departamento.model';
import { Industria } from '../../shared/models/industria.model';
import { TipoCargo } from '../../shared/models/tipo-cargo.model';
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

    // Catálogos de la ficha de datos generales de la batería: en su orden (por id), no alfabético
    // ("Primaria incompleta, Primaria completa…", "Uno, Dos, Tres…", horas 1 a 12).

    sexos(): Observable<Catalogo[]> {
        return this.listar<Catalogo>('sexos', 'id');
    }

    estadosCiviles(): Observable<Catalogo[]> {
        return this.listar<Catalogo>('estados-civiles', 'id');
    }

    nivelesAcademicos(): Observable<Catalogo[]> {
        return this.listar<Catalogo>('niveles-academicos', 'id');
    }

    estratos(): Observable<Catalogo[]> {
        return this.listar<Catalogo>('estratos-socioeconomicos', 'id');
    }

    tiposVivienda(): Observable<Catalogo[]> {
        return this.listar<Catalogo>('tipos-viviendas', 'id');
    }

    /** De él sale el grupo ocupacional: jefatura y profesional → forma A; auxiliar y operario → forma B. */
    tiposCargo(): Observable<TipoCargo[]> {
        return this.listar<TipoCargo>('tipo-cargo', 'id');
    }

    tiemposCargo(): Observable<Catalogo[]> {
        return this.listar<Catalogo>('tiempo-cargo', 'id');
    }

    tiposContrato(): Observable<Catalogo[]> {
        return this.listar<Catalogo>('tipo-contrato', 'id');
    }

    horasLabor(): Observable<Catalogo[]> {
        return this.listar<Catalogo>('horas-labor', 'id');
    }

    tiposSalario(): Observable<Catalogo[]> {
        return this.listar<Catalogo>('tipo-salario', 'id');
    }

    private listar<T extends Catalogo>(ruta: string, orden: 'nombre' | 'id' = 'nombre'): Observable<T[]> {
        if (!this.cache.has(ruta)) {
            const comparar = orden === 'id'
                ? (a: T, b: T) => a.id - b.id
                : (a: T, b: T) => a.nombre.localeCompare(b.nombre, 'es');
            const peticion = this.http.get<ApiResponse<T[]>>(`${environment.apiUrl}/${ruta}`).pipe(
                map(respuesta => [...respuesta.data].sort(comparar)),
                shareReplay({ bufferSize: 1, refCount: false })
            );
            this.cache.set(ruta, peticion);
            peticion.subscribe({ error: () => this.cache.delete(ruta) });
        }
        return this.cache.get(ruta) as Observable<T[]>;
    }

}
