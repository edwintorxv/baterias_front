/** Resultado de un intento de ingreso (registro_ingreso del backend, V22). */
export type ResultadoIngreso = 'EXITOSO' | 'FALLIDO' | 'BLOQUEADO';

export const RESULTADO_INGRESO: Record<ResultadoIngreso, { etiqueta: string; severidad: 'success' | 'warn' | 'danger' }> = {
    EXITOSO: { etiqueta: 'Exitoso', severidad: 'success' },
    FALLIDO: { etiqueta: 'Fallido', severidad: 'warn' },
    BLOQUEADO: { etiqueta: 'Bloqueado', severidad: 'danger' }
};

/** Un intento: el correo escrito (aunque no exista), el usuario si existe, IP, navegador y resultado. */
export interface Ingreso {
    id: number;
    /** Hora local, yyyy-MM-ddTHH:mm:ss. */
    fecha: string;
    correo: string;
    idUsuario: number | null;
    nombreUsuario: string | null;
    ip: string;
    /** User-Agent tal como llegó (máximo 255 caracteres). */
    navegador: string | null;
    resultado: ResultadoIngreso;
}

/**
 * GET /registro-ingresos: intentos de un rango de días, del más reciente al más antiguo. Los totales cuentan
 * todo el rango; `truncado` = las filas se cortaron en 2.000 (acortar el rango).
 */
export interface ConsultaIngresos {
    desde: string;
    hasta: string;
    exitosos: number;
    fallidos: number;
    bloqueados: number;
    truncado: boolean;
    filas: Ingreso[];
}

/** Navegador y sistema a partir del User-Agent, para leerlo de un vistazo ("Chrome · macOS"). */
export const navegadorCorto = (agente: string | null): string => {
    if (!agente) {
        return '—';
    }
    const navegador =
        /Edg\//.test(agente) ? 'Edge'
            : /OPR\/|Opera/.test(agente) ? 'Opera'
                : /Firefox\//.test(agente) ? 'Firefox'
                    : /Chrome\/|CriOS\//.test(agente) ? 'Chrome'
                        : /Safari\//.test(agente) ? 'Safari'
                            : /^curl\//.test(agente) ? 'curl'
                                : 'Otro';
    const sistema =
        /iPhone|iPad/.test(agente) ? 'iOS'
            : /Android/.test(agente) ? 'Android'
                : /Windows/.test(agente) ? 'Windows'
                    : /Mac OS X|Macintosh/.test(agente) ? 'macOS'
                        : /Linux/.test(agente) ? 'Linux'
                            : '';
    return sistema ? `${navegador} · ${sistema}` : navegador;
};
