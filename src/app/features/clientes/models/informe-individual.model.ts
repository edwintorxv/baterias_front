/**
 * GET /clientes/{idCliente}/evaluados/{idEvaluado}/informe?anio=: el informe del trabajador (historia clínica
 * ocupacional). Solo lo ve el psicólogo asignado al cliente.
 */
export interface InformeIndividual {
    cliente: { id: number; nit: string; nombre: string };
    evaluado: EvaluadoInforme;
    aplicaciones: AplicacionInforme[];
}

export interface EvaluadoInforme {
    id: number;
    numeroIdentificacion: string;
    nombre: string;
    apellido: string;
    sexo: string | null;
    anioNacimiento: number | null;
}

export interface AplicacionInforme {
    fkAplicacion: number;
    fechaAplicacion: string;
    nombreCargo: string | null;
    nombreArea: string | null;
    /** En el año de la aplicación (solo se conoce el año de nacimiento). */
    edad: number | null;
    fkGrupoOcupacional: number | null;
    grupoOcupacional: string | null;
    evaluador: EvaluadorInforme | null;
    observaciones: string | null;
    recomendaciones: string | null;
    estadoResultados: 'CALCULADO' | 'PENDIENTE';
    resultados: ResultadosAplicacion | null;
    /** Síntomas de estrés reportados Siempre o Casi siempre, por grupo en el orden del cuestionario; vacía sin respuestas de estrés. */
    sintomasFrecuentes: GrupoSintomas[];
}

/** El manual no trae baremos por dimensión de estrés: solo los síntomas, sin puntaje ni nivel. */
export interface GrupoSintomas {
    nombre: string;
    /** Vacía si no reportó ninguno con frecuencia. */
    sintomas: SintomaFrecuente[];
}

export interface SintomaFrecuente {
    /** Número de la pregunta (referencia). */
    numero: number;
    descripcion: string;
    /** Siempre o Casi siempre. */
    frecuencia: string;
}

export interface EvaluadorInforme {
    id: number;
    numeroIdentificacion: string;
    nombre: string;
    profesion: string | null;
    posgrado: string | null;
    tarjetaProfesional: string | null;
    licenciaSaludOcupacional: string | null;
    fechaExpedicionLicencia: string | null;
    tieneFirma: boolean;
}

export interface ResultadosAplicacion {
    fkAplicacion: number;
    fkGrupoOcupacional: number;
    fechaCalculo: string;
    cuestionarios: ResultadoCuestionario[];
    totalGeneral: ResultadoTotalGeneral | null;
}

/** forma: A y B intralaboral, C extralaboral, D estrés. A/B traen dominios y dimensiones; C dimensiones; D ninguno. */
export interface ResultadoCuestionario {
    fkCuestionario: number;
    forma: string;
    puntajeBruto: number;
    puntajeTransformado: number;
    fkNivelRiesgo: number;
    nivelRiesgo: string;
    dominios: ResultadoDetalle[];
    dimensiones: ResultadoDetalle[];
}

export interface ResultadoDetalle {
    id: number;
    nombre: string;
    puntajeBruto: number;
    puntajeTransformado: number;
    fkNivelRiesgo: number;
    nivelRiesgo: string;
}

/** Intralaboral (A o B) + extralaboral. */
export interface ResultadoTotalGeneral {
    fkCuestionarioIntralaboral: number;
    formaIntralaboral: string;
    puntajeBruto: number;
    puntajeTransformado: number;
    fkNivelRiesgo: number;
    nivelRiesgo: string;
}

/** Título de cada cuestionario en el informe, por forma. */
export const TITULO_FORMA: Partial<Record<string, string>> = {
    A: 'Intralaboral – Forma A',
    B: 'Intralaboral – Forma B',
    C: 'Extralaboral',
    D: 'Síntomas de estrés'
};

/** El estrés usa los mismos niveles 1–5, mostrados como en el manual (Tabla 6). */
export const NIVEL_ESTRES: Record<number, string> = {
    1: 'Muy bajo',
    2: 'Bajo',
    3: 'Medio',
    4: 'Alto',
    5: 'Muy alto'
};
