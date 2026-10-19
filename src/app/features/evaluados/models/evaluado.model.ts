/** GET /evaluados/{id}: solo los datos que no cambian (los que cambian están en la relación con cada cliente). */
export interface Evaluado {
    id: number;
    numeroIdentificacion: string;
    nombre: string;
    apellido: string;
    fkSexo: number | null;
    anioNacimiento: number | null;
}

/** PUT /evaluados/{id}: corregir errores de digitación (la corrección se ve en todas sus empresas). */
export interface EvaluadoRequest {
    numeroIdentificacion: string;
    nombre: string;
    apellido: string;
    fkSexo: number | null;
    anioNacimiento: number | null;
}
