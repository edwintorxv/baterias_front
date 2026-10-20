import { ValidationErrors } from '@angular/forms';

/** Mensaje de cada error de validación (Validators de Angular + CustomValidators). */
const MENSAJES: Record<string, (error: any) => string> = {
    required: () => 'Campo obligatorio',
    maxlength: e => `Máximo ${e.requiredLength} caracteres`,
    minlength: e => `Mínimo ${e.requiredLength} caracteres`,
    soloNumeros: () => 'Solo números',
    nit: () => 'Solo números, con dígito de verificación opcional (900123456-7)',
    soloLetras: () => 'Solo letras',
    texto: () => 'Tiene caracteres no permitidos',
    direccion: () => 'Use letras, números y # . , - /',
    telefono: () => 'De 7 a 10 dígitos, sin espacios',
    correoElectronico: () => 'Correo electrónico inválido',
    documento: () => 'Solo letras, números y guion, sin espacios ni puntos',
    usuario: () => 'Solo minúsculas, números y . _ - sin espacios',
    igualA: () => 'Las contraseñas no coinciden',
    min: e => `Mínimo ${e.min}`,
    max: e => `Máximo ${e.max}`
};

/** Primer mensaje de los errores de un control, o null si no hay. */
export function mensajeValidacion(errores: ValidationErrors | null): string | null {
    if (!errores) {
        return null;
    }
    const clave = Object.keys(errores)[0];
    const mensaje = MENSAJES[clave];
    return mensaje ? mensaje(errores[clave]) : 'Valor inválido';
}
