/**
 * GET /evaluado-clientes/{id}: la relación de una persona con un cliente, con su foto (datos laborales y
 * los datos de la persona que cambian) y su vigencia.
 */
export interface EvaluadoCliente {
    id: number;
    fkEvaluado: number;
    fkCliente: number;
    fkCiudadTrabajo: number | null;
    antiguedadEmpresa: string | null;
    nombreCargo: string | null;
    fkTipoCargo: number | null;
    fkTiempoCargo: number | null;
    nombreArea: string | null;
    fkTipoContrato: number | null;
    fkHorasLabor: number | null;
    fkTipoSalario: number | null;
    fkEstadoCivil: number | null;
    fkNivelAcademico: number | null;
    fkCiudadResidencia: number | null;
    fkEstratoSocioeconomico: number | null;
    fkTipoVivienda: number | null;
    ocupacionProfesion: string | null;
    familiaresDependientesEconomicamente: number | null;
    /** yyyy-MM-dd */
    fechaVinculacion: string;
    /** yyyy-MM-dd; null = vigente. */
    fechaRetiro: string | null;
    activo: boolean;
}

/**
 * PUT /evaluado-clientes/{id}: reemplaza todo. Una relación inactiva no se edita, solo se activa (409).
 * fechaVinculacion null = se conserva; fechaRetiro solo cuenta al inactivar (null = hoy).
 */
export type EvaluadoClienteRequest = Omit<EvaluadoCliente, 'id' | 'fechaVinculacion'> & {
    fechaVinculacion: string | null;
};
