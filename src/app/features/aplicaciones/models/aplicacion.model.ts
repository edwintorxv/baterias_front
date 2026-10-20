/** GET /aplicaciones/{id} */
export interface Aplicacion {
    id: number;
    fkEvaluadoCliente: number;
    fkGrupoOcupacional: number | null;
    /** yyyy-MM-ddTHH:mm:ss */
    fechaAplicacion: string | null;
    observaciones: string | null;
    recomendaciones: string | null;
    estado: string | null;
    /** null = no se registró la pregunta filtro. */
    atiendeClientes: boolean | null;
    esJefe: boolean | null;
    fkEvaluador: number | null;
}

/**
 * PUT /aplicaciones/{id}: reemplaza observaciones y recomendaciones (null = vacías); el resto, si va en null,
 * se conserva. Firmante: vacío, el propio o el que ya tenía (403 si otro).
 */
export type AplicacionRequest = Omit<Aplicacion, 'id'>;
