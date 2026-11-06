import { Rol } from '../../../core/models/sesion.model';

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
