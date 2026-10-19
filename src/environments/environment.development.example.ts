import { Environment } from './environment.model';

/**
 * Copiar como environment.development.ts (está en .gitignore) y poner las contraseñas de la BD local.
 * El primer usuario es el que entra solo al arrancar; los demás salen en el selector de la barra superior.
 */
export const environment: Environment = {
    production: false,
    apiUrl: 'http://localhost:8080/api',
    usuariosPrueba: [
        { etiqueta: 'Psicóloga', usuario: 'psicologa', contrasena: '' },
        { etiqueta: 'Administrador', usuario: 'admin', contrasena: '' },
        { etiqueta: 'Cliente (RRHH Cardins)', usuario: 'rrhh.cardins', contrasena: '' }
    ]
};
