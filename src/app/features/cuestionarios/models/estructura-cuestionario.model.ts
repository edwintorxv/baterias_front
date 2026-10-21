/** GET /cuestionarios (CuestionarioResponse). */
export interface Cuestionario {
    id: number;
    forma: string;
    descripcion: string;
    factorTransformacion: number;
    metodoCalculo: MetodoCalculo;
}

export type MetodoCalculo = 'SUMA_POR_DOMINIOS' | 'SUMA_DIRECTA' | 'PROMEDIO_PONDERADO';
export type CondicionAplicacion = 'ATIENDE_CLIENTES' | 'ES_JEFE';

/** GET /cuestionarios/{id}/estructura: la configuración completa, en el orden del manual. */
export interface EstructuraCuestionario {
    id: number;
    forma: string;
    nombre: string;
    metodoCalculo: MetodoCalculo;
    factorTransformacion: number;
    totalPreguntas: number;
    /** Del puntaje total del cuestionario. */
    baremos: Baremo[];
    /** En C y D hay uno solo que únicamente agrupa (sin baremos): la pantalla no lo muestra. */
    dominios: DominioEstructura[];
    /** Solo las que usan sus preguntas. */
    escalas: Escala[];
}

export interface DominioEstructura {
    id: number;
    nombre: string;
    factorTransformacion: number;
    baremos: Baremo[];
    dimensiones: DimensionEstructura[];
}

export interface DimensionEstructura {
    id: number;
    nombre: string;
    factorTransformacion: number;
    /** Solo en D (promedio ponderado). */
    peso: number | null;
    condicionAplicacion: CondicionAplicacion | null;
    maxItemsSinRespuesta: number;
    baremos: Baremo[];
    preguntas: PreguntaEstructura[];
}

export interface PreguntaEstructura {
    id: number;
    numero: number;
    descripcion: string;
    idEscala: number;
}

export interface Escala {
    id: number;
    nombre: string;
    /** En el orden de la escala (Siempre … Nunca), con el puntaje que suma cada opción. */
    opciones: { id: number; nombre: string; valor: number }[];
}

/** Rango del puntaje transformado de un nivel para un grupo ocupacional. */
export interface Baremo {
    idGrupoOcupacional: number;
    idNivelRiesgo: number;
    nivelRiesgo: string;
    valorMinimo: number;
    valorMaximo: number;
}

/** GET /cuestionarios/total-general: uno por forma intralaboral (Tabla 34). */
export interface TotalGeneral {
    idCuestionarioIntralaboral: number;
    formaIntralaboral: string;
    formaExtralaboral: string;
    /** Suma de los factores de ambos cuestionarios (616 en A + C, 512 en B + C). */
    factorTransformacion: number;
    baremos: Baremo[];
}

export const METODO_CALCULO: Record<MetodoCalculo, { etiqueta: string; explicacion: string }> = {
    SUMA_POR_DOMINIOS: {
        etiqueta: 'Suma por dominios',
        explicacion: 'Se suman los ítems de cada dimensión, de cada dominio y del total; cada puntaje bruto se '
            + 'transforma con su factor (bruto ÷ factor × 100) y se ubica en el baremo del grupo ocupacional.'
    },
    SUMA_DIRECTA: {
        etiqueta: 'Suma directa',
        explicacion: 'Se suman los ítems de cada dimensión y del total; cada puntaje bruto se transforma con su '
            + 'factor (bruto ÷ factor × 100) y se ubica en el baremo del grupo ocupacional.'
    },
    PROMEDIO_PONDERADO: {
        etiqueta: 'Promedio ponderado',
        explicacion: 'Se promedian los ítems de cada grupo de síntomas y se multiplican por el peso del grupo; la '
            + 'suma es el puntaje bruto total, que se transforma con el factor (bruto ÷ factor × 100). Solo hay baremos '
            + 'del total.'
    }
};

export const CONDICION_APLICACION: Record<CondicionAplicacion, string> = {
    ATIENDE_CLIENTES: 'Solo si atiende clientes o usuarios',
    ES_JEFE: 'Solo si es jefe (tiene personas a cargo)'
};
