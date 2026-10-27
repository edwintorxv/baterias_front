import { Environment } from './environment.model';

/**
 * Producción (static site de Render). La API es otro servicio de Render: si al crearlo el nombre
 * "baterias-backend" no está libre, cambiar aquí la URL que Render le asigne.
 */
export const environment: Environment = {
    production: true,
    apiUrl: 'https://baterias-backend-2810.onrender.com/api',
    usuariosPrueba: []
};
