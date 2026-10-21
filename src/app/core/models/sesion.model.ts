export type Rol = 'ADMIN' | 'PSICOLOGO' | 'CLIENTE' | 'EVALUADO';

export const NOMBRE_ROL: Record<Rol, string> = {
    ADMIN: 'Administrador',
    PSICOLOGO: 'Psicólogo',
    CLIENTE: 'Cliente',
    EVALUADO: 'Evaluado'
};

/** GET /auth/yo y el usuario que viene en el login. */
export interface UsuarioSesion {
    id: number;
    /** Con él se ingresa. */
    correo: string;
    nombre: string;
    rol: Rol;
    idEvaluador: number | null;
    idCliente: number | null;
}

/** POST /auth/login */
export interface LoginResponse {
    token: string;
    tipo: string;
    expiraEn: number;
    expira: string;
    usuario: UsuarioSesion;
}
