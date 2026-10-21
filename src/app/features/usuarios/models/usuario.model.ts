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

/** PUT /usuarios/{id}: sin contraseña (va por PUT /usuarios/{id}/contrasena). Un solo vínculo según el rol. */
export interface UsuarioRequest {
    correo: string;
    nombre: string;
    rol: Rol;
    idEvaluador: number | null;
    idCliente: number | null;
    idEvaluado: number | null;
    activo: boolean | null;
}

/** POST /usuarios */
export interface UsuarioCrearRequest extends UsuarioRequest {
    contrasena: string;
}

/** Roles que se pueden crear desde la pantalla: EVALUADO queda para cuando se responda en línea. */
export const ROLES_CREABLES: Rol[] = ['ADMIN', 'PSICOLOGO', 'CLIENTE'];
