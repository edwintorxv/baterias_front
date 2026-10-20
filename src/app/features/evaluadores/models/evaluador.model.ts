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

/** POST/PUT /evaluadores (solo ADMIN). activo null = se conserva (al crear queda activo). */
export interface EvaluadorRequest {
    numeroIdentificacion: string;
    nombre: string;
    profesion: string;
    posgrado: string | null;
    tarjetaProfesional: string;
    licenciaSaludOcupacional: string;
    /** yyyy-MM-dd */
    fechaExpedicionLicencia: string;
    activo: boolean | null;
}

/** Firma: PNG o JPG de hasta 1 MB (lo mismo que valida el backend). */
export const FIRMA_TIPOS = ['image/png', 'image/jpeg'];
export const FIRMA_MAXIMO_BYTES = 1024 * 1024;
