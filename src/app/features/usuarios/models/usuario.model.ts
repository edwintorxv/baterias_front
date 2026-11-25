import { Rol } from '../../../core/models/sesion.model';

/**
 * Si el usuario ya puede ingresar: DEFINIDA (tiene contraseña), PENDIENTE (tiene un enlace sin usar, que vence en
 * `venceEnlace`) o SIN_ENLACE (su enlace venció o se anuló: hay que generarle otro).
 */
export type EstadoContrasena = 'DEFINIDA' | 'PENDIENTE' | 'SIN_ENLACE';

export const NOMBRE_ESTADO_CONTRASENA: Record<EstadoContrasena, string> = {
    DEFINIDA: 'Definida',
    PENDIENTE: 'Pendiente',
    SIN_ENLACE: 'Sin enlace vigente'
};

/**
 * GET /usuarios (solo ADMIN). El vínculo depende del rol: PSICOLOGO → evaluador, CLIENTE → cliente,
 * EVALUADO → persona; ADMIN sin vínculo.
 */
export interface Usuario {
    id: number;
    /** Con él se ingresa (único, en minúsculas). */
    correo: string;
    nombre: string;
    rol: Rol;
    idEvaluador: number | null;
    idCliente: number | null;
    idEvaluado: number | null;
    activo: boolean;
    estadoContrasena: EstadoContrasena;
    /** Solo si está PENDIENTE: vencimiento del enlace (hora local, yyyy-MM-ddTHH:mm:ss). */
    venceEnlace: string | null;
}

export const SEVERIDAD_ROL: Record<Rol, 'contrast' | 'info' | 'success' | 'secondary'> = {
    ADMIN: 'contrast',
    PSICOLOGO: 'info',
    CLIENTE: 'success',
    EVALUADO: 'secondary'
};

/**
 * PUT /usuarios/{id}. Un solo vínculo según el rol. Nunca lleva contraseña: el administrador no la ve ni la
 * escribe; el usuario la define con el enlace que le llega por correo.
 */
export interface UsuarioRequest {
    correo: string;
    nombre: string;
    rol: Rol;
    idEvaluador: number | null;
    idCliente: number | null;
    idEvaluado: number | null;
    activo: boolean | null;
}

/** POST /usuarios: se crea sin contraseña y, si queda activo, recibe la invitación por correo. */
export type UsuarioCrearRequest = UsuarioRequest;

/** Roles que se pueden crear desde la pantalla: EVALUADO queda para cuando se responda en línea. */
export const ROLES_CREABLES: Rol[] = ['ADMIN', 'PSICOLOGO', 'CLIENTE'];
