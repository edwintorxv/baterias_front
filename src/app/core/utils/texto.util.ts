/**
 * Texto para buscar sin distinguir mayúsculas ni tildes: "medellin" encuentra "MEDELLÍN". Acepta números (código
 * DANE, documento) y vacíos.
 */
export const normalizar = (texto: string | number | null | undefined): string =>
    String(texto ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
