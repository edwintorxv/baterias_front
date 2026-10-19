/** GET /clientes/{id}/personas: una fila por relación evaluado-cliente. */
export interface PersonaCliente {
    idRelacion: number;
    idEvaluado: number;
    numeroIdentificacion: string;
    nombre: string;
    apellido: string;
    nombreCargo: string | null;
    tipoCargo: string | null;
    nombreArea: string | null;
    ciudadTrabajo: string | null;
    activo: boolean;
    aplicaciones: number;
    ultimaAplicacion: UltimaAplicacion | null;
}

export interface UltimaAplicacion {
    id: number;
    fecha: string;
    estado: string | null;
    /** La persona ya respondió; sin respuestas la aplicación solo está creada. */
    conRespuestas: boolean;
    /** Ya se calcularon sus resultados (si no, el informe individual aún no sale). */
    conResultados: boolean;
}

/** Situación de la persona según su última aplicación, para filtrar y mostrar la etiqueta. */
export type SituacionPersona = 'CON_RESULTADOS' | 'PENDIENTE_CALCULO' | 'SIN_RESPUESTAS' | 'SIN_APLICACION';

export const SITUACION_PERSONA: Record<SituacionPersona, { etiqueta: string; severidad: 'success' | 'warn' | 'secondary' }> = {
    CON_RESULTADOS: { etiqueta: 'Con resultados', severidad: 'success' },
    PENDIENTE_CALCULO: { etiqueta: 'Pendiente de cálculo', severidad: 'warn' },
    SIN_RESPUESTAS: { etiqueta: 'Sin respuestas', severidad: 'secondary' },
    SIN_APLICACION: { etiqueta: 'Sin aplicación', severidad: 'secondary' }
};

export function situacionPersona(persona: PersonaCliente): SituacionPersona {
    if (!persona.ultimaAplicacion) {
        return 'SIN_APLICACION';
    }
    if (persona.ultimaAplicacion.conResultados) {
        return 'CON_RESULTADOS';
    }
    return persona.ultimaAplicacion.conRespuestas ? 'PENDIENTE_CALCULO' : 'SIN_RESPUESTAS';
}
