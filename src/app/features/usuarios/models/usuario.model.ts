import { Rol } from '../../../core/models/sesion.model';

/**
 * GET /usuarios (solo ADMIN). El vínculo depende del rol: PSICOLOGO → evaluador, CLIENTE → cliente,
 * EVALUADO → persona; ADMIN sin vínculo.
 */
export interface Usuario {
    id: number;
    usuario: string;
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
