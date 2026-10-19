/** GET /evaluadores: la firma no viaja aquí, tieneFirma indica si existe. */
export interface Evaluador {
    id: number;
    numeroIdentificacion: string;
    nombre: string;
    profesion: string | null;
    posgrado: string | null;
    tarjetaProfesional: string | null;
    licenciaSaludOcupacional: string | null;
    fechaExpedicionLicencia: string | null;
    activo: boolean;
    tieneFirma: boolean;
}
