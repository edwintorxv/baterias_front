/** Sin caracteres que se confunden al dictarla o copiarla a mano (0/O, 1/l/I). */
const LETRAS = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITOS = '23456789';
const SIGNOS = '#$%&*+-=?@';

/** Largo mínimo y máximo de la contraseña (los del backend: BCrypt solo usa 72 bytes). */
export const CONTRASENA_MINIMO = 8;
export const CONTRASENA_MAXIMO = 72;

/**
 * Contraseña aleatoria para que el administrador la entregue: 12 caracteres con letras, al menos dos
 * dígitos y un signo, con el generador criptográfico del navegador.
 */
export function generarContrasena(largo = 12): string {
    const elegir = (fuente: string) => fuente[aleatorio(fuente.length)];
    const caracteres = [elegir(DIGITOS), elegir(DIGITOS), elegir(SIGNOS)];
    while (caracteres.length < largo) {
        caracteres.push(elegir(LETRAS + DIGITOS));
    }
    // Mezcla (Fisher-Yates) para que los dígitos y el signo no queden siempre al principio.
    for (let i = caracteres.length - 1; i > 0; i--) {
        const j = aleatorio(i + 1);
        [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
    }
    return caracteres.join('');
}

function aleatorio(maximo: number): number {
    const valor = new Uint32Array(1);
    crypto.getRandomValues(valor);
    return valor[0] % maximo;
}
