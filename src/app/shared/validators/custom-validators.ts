import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Valida con una expresión regular; vacío pasa (para eso está Validators.required). */
const patron = (clave: string, regex: RegExp): ValidatorFn =>
    (control: AbstractControl): ValidationErrors | null => {
        const valor = control.value;
        if (valor === null || valor === undefined || String(valor).trim() === '') {
            return null;
        }
        return regex.test(String(valor).trim()) ? null : { [clave]: true };
    };

/**
 * Validaciones de formato para formularios. Aceptan tildes, ñ y ü (\p{L}), que en nombres, cargos y
 * razones sociales en español son lo normal. Los mensajes están en mensajes-validacion.ts.
 */
export class CustomValidators {

    static soloNumeros = patron('soloNumeros', /^[0-9]+$/);

    /** NIT sin puntos: 5 a 15 dígitos, con dígito de verificación opcional (900123456-7). */
    static nit = patron('nit', /^[0-9]{5,15}(-[0-9])?$/);

    /** Nombres de personas: letras, espacios, apóstrofo, punto y guion (María José O'Neil-Peña). */
    static soloLetras = patron('soloLetras', /^[\p{L}\s'.-]+$/u);

    /** Razón social, cargo y textos cortos: letras, números y puntuación común (CALZADO S.A.S. & CÍA). */
    static texto = patron('texto', /^[\p{L}\p{N}\s.,;:&'"()\/#°ºª+-]+$/u);

    /** Direcciones colombianas: CARRERA 24 No. 5 - 55, Cra 45 # 12-30 Apto 301, Km 5 vía Cali. */
    static direccion = patron('direccion', /^[\p{L}\p{N}\s.,#°º\/-]+$/u);

    /** Teléfono: 7 a 10 dígitos, sin espacios ni signos (fijo o celular). */
    static telefono = patron('telefono', /^[0-9]{7,10}$/);

    /** Número de identificación: letras, números y guion (cédulas, pasaportes, PPT). */
    static documento = patron('documento', /^[0-9A-Za-z-]+$/);

    static correoElectronico = patron('correoElectronico', /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);

    /** Igual al campo hermano indicado (confirmar contraseña). Vacío pasa: para eso está required. */
    static igualA(campo: string): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const otro = control.parent?.get(campo);
            if (!otro || !control.value) {
                return null;
            }
            return control.value === otro.value ? null : { igualA: true };
        };
    }

}
