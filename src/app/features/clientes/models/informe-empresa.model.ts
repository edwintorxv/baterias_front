/**
 * GET /clientes/{id}/informe?anio=: solo las partes que muestran las pantallas (informe y estadísticas); lo
 * que aún no se muestra —extralaborales y síntomas de estrés— va en el Word.
 */
export interface InformeEmpresa {
    cliente: { id: number; nit: string; nombre: string };
    anio: number;
    cobertura: Cobertura;
    coberturaPorCiudad: CoberturaCiudad[];
    /** Respondieron pero aún no tienen resultados: cuentan como evaluados, no entran en las tablas. */
    pendientesCalculo: number;
    poblacion: Poblacion;
    resultadosGlobales: ResultadosGlobales;
    /** Una por forma intralaboral presentada (A, B). */
    formas: FormaIntralaboral[];
    /** Formas A y B juntas. */
    concentracionIntralaboral: ConcentracionIntralaboral;
    conclusiones: ConclusionesEmpresa;
}

export interface Cobertura {
    esperados: number;
    evaluados: number;
    porcentaje: number;
}

export interface CoberturaCiudad extends Cobertura {
    idCiudad: number | null;
    ciudad: string;
}

export interface ResultadosGlobales {
    intralaboral: DistribucionNiveles;
    nivelEmpresa: NivelEmpresa;
    extralaboral: DistribucionNiveles;
    totalGeneral: DistribucionNiveles;
    estres: DistribucionNiveles;
}

/** Características de las personas evaluadas (forma, sexo, edad, nivel académico, tipo de cargo y contrato). */
export interface Poblacion {
    /** Personas evaluadas: el total de cada variable. */
    personas: number;
    variables: VariablePoblacion[];
}

export interface VariablePoblacion {
    nombre: string;
    categorias: CategoriaCantidad[];
}

/** El % es sobre el total de la variable. */
export interface CategoriaCantidad {
    categoria: string;
    cantidad: number;
    porcentaje: number;
}

/** Personas por nivel de riesgo; el % es sobre el total de la tabla. */
export interface DistribucionNiveles {
    total: number;
    niveles: NivelCantidad[];
}

export interface NivelCantidad {
    fkNivelRiesgo: number;
    nivel: string;
    cantidad: number;
    porcentaje: number;
}

/**
 * Rankings: del más crítico al menos crítico sin sumar niveles (primero el mayor % en muy alto, luego alto…;
 * empate: orden del cuestionario). Así vienen del backend.
 */
export interface FormaIntralaboral {
    idCuestionario: number;
    forma: string;
    personas: number;
    /** Ranking de dominios, cada uno con el ranking de sus dimensiones. */
    dominios: DominioEmpresa[];
}

export interface DominioEmpresa {
    idDominioCuestionario: number;
    nombre: string;
    distribucion: DistribucionNiveles;
    dimensiones: DistribucionItem[];
}

export interface DistribucionItem {
    id: number;
    nombre: string;
    distribucion: DistribucionNiveles;
}

export interface ConcentracionIntralaboral {
    /** Ranking de los dominios (id = id del dominio). */
    dominios: DistribucionItem[];
    /** Nivel intralaboral total por ciudad de trabajo. */
    porCiudad: DesgloseGrupos;
    /** Nivel intralaboral total por área. */
    porArea: DesgloseGrupos;
}

/** Grupos con menos de 2 personas se juntan en "Otras…" (al final); si aun juntos no llegan, se omiten. */
export interface DesgloseGrupos {
    /** De más a menos personas. */
    grupos: { grupo: string; distribucion: DistribucionNiveles }[];
    /** Grupos pequeños que se juntaron en "Otras…". */
    agrupados: number;
    /** Personas que no se muestran por confidencialidad. */
    omitidos: number;
}

/** Res. 2764 de 2022, art. 3: anual si alguna forma queda en alto o muy alto. */
export interface NivelEmpresa {
    formas: NivelForma[];
    periodicidad: 'ANUAL' | 'CADA_DOS_ANIOS';
    periodicidadDescripcion: string;
}

export interface NivelForma {
    idCuestionario: number;
    forma: string;
    personas: number;
    promedioPuntajeBruto: number;
    puntajeTransformado: number;
    fkNivelRiesgo: number;
    nivel: string;
}

export interface ConclusionesEmpresa {
    conclusiones: string | null;
    accionesCortoPlazo: string | null;
    accionesMedianoPlazo: string | null;
    accionesLargoPlazo: string | null;
    profesional: ProfesionalInforme | null;
    /** Lo que falta para descargar el Word; vacío = se puede descargar. */
    faltantes: string[];
}

export interface ProfesionalInforme {
    id: number;
    numeroIdentificacion: string;
    nombre: string;
    profesion: string | null;
    tarjetaProfesional: string | null;
    tieneFirma: boolean;
}

/** GET/PUT /clientes/{id}/informe/conclusiones?anio= */
export interface ConclusionesInforme {
    idCliente: number;
    anio: number;
    /** false = aún no se ha guardado nada para el año (todo viene vacío). */
    guardado: boolean;
    conclusiones: string | null;
    accionesCortoPlazo: string | null;
    accionesMedianoPlazo: string | null;
    accionesLargoPlazo: string | null;
    fkEvaluador: number | null;
    fechaCreado: string | null;
    fechaModificado: string | null;
}

/** El PUT reemplaza todo lo del año: lo que vaya en null queda vacío. */
export interface ConclusionesInformeRequest {
    conclusiones: string | null;
    accionesCortoPlazo: string | null;
    accionesMedianoPlazo: string | null;
    accionesLargoPlazo: string | null;
    fkEvaluador: number | null;
}

/** Colores semáforo del Word de empresa (DocxSoporte.COLOR_NIVEL), por fkNivelRiesgo. */
export const COLOR_NIVEL: Record<number, string> = {
    1: '#00B050',
    2: '#92D050',
    3: '#FFD700',
    4: '#FF8C00',
    5: '#E53935'
};
