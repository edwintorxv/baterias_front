/**
 * POST /clientes/{id}/personas: crea o reutiliza la persona (por documento) y la deja activa en el cliente.
 * Obligatorios: documento, nombre, apellido, sexo, año de nacimiento, nivel académico y tipo de cargo.
 */
export interface VincularPersonaRequest {
    // La persona (si ya existe, ganan estos datos)
    numeroIdentificacion: string;
    nombre: string;
    apellido: string;
    fkSexo: number;
    anioNacimiento: number;

    // Datos de la persona que cambian (foto de esta vinculación)
    fkEstadoCivil: number | null;
    fkNivelAcademico: number;
    fkCiudadResidencia: number | null;
    fkEstratoSocioeconomico: number | null;
    fkTipoVivienda: number | null;
    ocupacionProfesion: string | null;
    familiaresDependientesEconomicamente: number | null;

    // Datos laborales
    fkCiudadTrabajo: number | null;
    antiguedadEmpresa: string | null;
    nombreCargo: string | null;
    fkTipoCargo: number;
    fkTiempoCargo: number | null;
    nombreArea: string | null;
    fkTipoContrato: number | null;
    fkHorasLabor: number | null;
    fkTipoSalario: number | null;
    /** yyyy-MM-dd; null = hoy. */
    fechaVinculacion: string | null;
}

export type ResultadoVinculacion = 'NUEVA' | 'VINCULA' | 'ACTUALIZA' | 'CAMBIA_EMPRESA';

export interface VinculacionResponse {
    resultado: ResultadoVinculacion;
    idEvaluado: number;
    /** La persona ya existía y se actualizaron nombre, apellido, sexo o año. */
    datosPersonaActualizados: boolean;
    relacion: { id: number; fkCliente: number; activo: boolean };
}

/** Edad permitida (VinculacionPersonaService del backend). */
export const EDAD_MINIMA = 14;
export const EDAD_MAXIMA = 90;
