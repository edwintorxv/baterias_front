/** GET /aplicaciones/{id} */
export interface Aplicacion {
    id: number;
    fkEvaluadoCliente: number;
    fkGrupoOcupacional: number | null;
    /** yyyy-MM-ddTHH:mm:ss */
    fechaAplicacion: string | null;
    observaciones: string | null;
    recomendaciones: string | null;
    /** null = no se registró la pregunta filtro. */
    atiendeClientes: boolean | null;
    esJefe: boolean | null;
    fkEvaluador: number | null;
}

/**
 * PUT /aplicaciones/{id}: reemplaza observaciones, recomendaciones y preguntas filtro (null = vacías / no
 * registrada); grupo, fecha y firmante en null se conservan. Por eso se manda siempre la aplicación completa
 * (GET + PUT). Firmante: vacío, el propio o el que ya tenía (403 si otro).
 */
export type AplicacionRequest = Omit<Aplicacion, 'id'>;
