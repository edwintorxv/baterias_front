/** Resultado de cada fila del archivo (POST /clientes/{id}/personas/carga). */
export type ResultadoFila = 'NUEVA' | 'VINCULA' | 'ACTUALIZA' | 'CAMBIA_EMPRESA' | 'ERROR';

export interface ResultadoCarga {
    totalFilas: number;
    /** Cuántas filas por resultado (vienen todas, aunque sea en 0). */
    resumen: Record<ResultadoFila, number>;
    /** Ninguna fila tiene errores. */
    puedeConfirmar: boolean;
    /** true solo en la respuesta de confirmar. */
    guardado: boolean;
    filas: FilaCarga[];
}

export interface FilaCarga {
    /** Número de la fila en Excel. */
    fila: number;
    documento: string | null;
    nombre: string;
    resultado: ResultadoFila;
    errores: string[];
}

export const RESULTADO_FILA: Record<ResultadoFila, {
    etiqueta: string;
    descripcion: string;
    severidad: 'success' | 'info' | 'secondary' | 'warn' | 'danger';
}> = {
    NUEVA: { etiqueta: 'Nueva', descripcion: 'Se crea la persona y se vincula', severidad: 'success' },
    VINCULA: { etiqueta: 'Vincula', descripcion: 'Ya existía: se vincula al cliente', severidad: 'info' },
    ACTUALIZA: { etiqueta: 'Actualiza', descripcion: 'Ya estaba en el cliente: se actualizan sus datos', severidad: 'secondary' },
    CAMBIA_EMPRESA: { etiqueta: 'Cambia de empresa', descripcion: 'Estaba activa en otra empresa: allí se inactiva', severidad: 'warn' },
    ERROR: { etiqueta: 'Error', descripcion: 'Hay que corregirla en el archivo', severidad: 'danger' }
};
