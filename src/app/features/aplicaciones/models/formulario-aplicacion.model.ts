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

/** Qué forma responde la persona, con la descripción de los grupos ocupacionales del manual. El id es el grupo ocupacional. */
export const FORMA_GRUPO: { id: number; forma: string; grupos: { nombre: string; descripcion: string }[] }[] = [
    {
        id: 1,
        forma: 'A',
        grupos: [
            {
                nombre: 'Jefes',
                descripcion: 'Comprende los cargos de dirección o jefatura. Se caracterizan por tener personas a cargo y por '
                    + 'asegurar la gestión y los resultados de una determinada sección o por la supervisión de otras personas. '
                    + 'Por ejemplo, gerentes, directores, jefes de oficina, de departamento, de sección, de taller, '
                    + 'supervisores, capataces o coordinadores, entre otros.'
            },
            {
                nombre: 'Profesionales o técnicos',
                descripcion: 'Personal calificado que ocupa cargos en los que hay dominio de una técnica, conocimiento o '
                    + 'destreza particular y en los que el trabajador tiene un buen grado de autonomía, por lo cual, en su '
                    + 'actividad laboral toma decisiones basándose en su criterio profesional o técnico. Sin embargo, no '
                    + 'supervisa y no responde por el trabajo de otras personas. Por ejemplo, profesionales, analistas, '
                    + 'técnicos o tecnólogos, entre otros.'
            }
        ]
    },
    {
        id: 2,
        forma: 'B',
        grupos: [
            {
                nombre: 'Auxiliares',
                descripcion: 'Cargos en los que se requiere el conocimiento de una técnica o destreza particular. Quienes '
                    + 'ocupan estos cargos tienen menor autonomía, por lo cual su actividad laboral está guiada por las '
                    + 'orientaciones o instrucciones dadas por un nivel superior. Por ejemplo, secretarias, recepcionistas, '
                    + 'conductores, almacenistas, digitadores, entre otros.'
            },
            {
                nombre: 'Operarios',
                descripcion: 'Comprende cargos en los que no se requieren conocimientos especiales. El trabajador sigue '
                    + 'instrucciones precisas de un superior. Por ejemplo, ayudantes de máquina, conserjes, personal de '
                    + 'servicios generales, obreros o vigilantes, entre otros.'
            }
        ]
    }
];

/** PUT /aplicaciones/{id}/respuestas/{idCuestionario}: reemplaza las de ese cuestionario (lo que no venga queda sin responder). */
export interface RespuestaDigitada {
    fkPregunta: number;
    fkOpcionRespuesta: number;
}
