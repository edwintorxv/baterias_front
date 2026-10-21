/** Usuario con el que el front entra solo en desarrollo (selector "Usuario de prueba"). */
export interface UsuarioPrueba {
    etiqueta: string;
    correo: string;
    contrasena: string;
}

export interface Environment {
    production: boolean;
    apiUrl: string;
    /** Solo desarrollo: el primero es el que entra al arrancar. Vacío = sin auto-login. */
    usuariosPrueba: UsuarioPrueba[];
}
