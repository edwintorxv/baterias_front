/** GET /aplicaciones/{id}/formulario: lo que se necesita para digitar una aplicación. */
export interface FormularioAplicacion {
    idAplicacion: number;
    idGrupoOcupacional: number | null;
    /** Pregunta filtro; null = no registrada. */
    atiendeClientes: boolean | null;
    esJefe: boolean | null;
    estado: EstadoAplicacion;
    /** A o B según el grupo ocupacional, más C y D. */
    cuestionarios: CuestionarioFormulario[];
}

export interface CuestionarioFormulario {
    id: number;
    forma: string;
    nombre: string;
    /** Preguntas que hay que responder (sin las que no aplican por una pregunta filtro). */
    aplicables: number;
    respondidas: number;
    preguntas: PreguntaFormulario[];
}

export interface PreguntaFormulario {
    id: number;
    numero: number;
    descripcion: string;
    /** Pregunta filtro de la que depende; null si siempre aplica. */
    condicion: CondicionAplicacion | null;
    /** false si la pregunta filtro de la aplicación es "no" (no se responde). */
    aplica: boolean;
    /** En el orden de la escala (Siempre … Nunca). */
    opciones: { id: number; nombre: string }[];
    /** Opción guardada; null sin responder. */
    respuesta: number | null;
}

export type CondicionAplicacion = 'ATIENDE_CLIENTES' | 'ES_JEFE';

export type EstadoAplicacion = 'SIN_RESPUESTAS' | 'INCOMPLETA' | 'PENDIENTE_CALCULO' | 'CALCULADA';

export const ESTADO_APLICACION: Record<EstadoAplicacion, { etiqueta: string; severidad: 'secondary' | 'warn' | 'info' | 'success' }> = {
    SIN_RESPUESTAS: { etiqueta: 'Sin respuestas', severidad: 'secondary' },
    INCOMPLETA: { etiqueta: 'Incompleta', severidad: 'warn' },
    PENDIENTE_CALCULO: { etiqueta: 'Pendiente de cálculo', severidad: 'info' },
    CALCULADA: { etiqueta: 'Calculada', severidad: 'success' }
};

/** Las preguntas filtro como las trae el cuestionario en papel. */
export const PREGUNTA_FILTRO: Record<CondicionAplicacion, { control: 'atiendeClientes' | 'esJefe'; texto: string }> = {
    ATIENDE_CLIENTES: { control: 'atiendeClientes', texto: 'En mi trabajo debo brindar servicio a clientes o usuarios' },
    ES_JEFE: { control: 'esJefe', texto: 'Soy jefe de otras personas en mi trabajo' }
};

/** PUT /aplicaciones/{id}/respuestas/{idCuestionario}: reemplaza las de ese cuestionario (lo que no venga queda sin responder). */
export interface RespuestaDigitada {
    fkPregunta: number;
    fkOpcionRespuesta: number;
}
