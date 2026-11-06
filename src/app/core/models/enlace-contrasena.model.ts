/** Estado del enlace para definir la contraseña (GET /auth/enlace, público). */
export type EstadoEnlace = 'VIGENTE' | 'VENCIDO' | 'USADO' | 'ANULADO' | 'INVALIDO';

/**
 * Si no está vigente solo trae el estado y el mensaje (que remite al administrador por teléfono); nombre, correo,
 * propósito y vencimiento solo si está vigente.
 */
export interface EnlaceContrasena {
    vigente: boolean;
    estado: EstadoEnlace;
    mensaje: string | null;
    proposito: 'INVITACION' | 'RESTABLECER' | null;
    nombre: string | null;
    correo: string | null;
    /** Hora local del backend, yyyy-MM-ddTHH:mm:ss. */
    vence: string | null;
}
