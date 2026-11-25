const dos = (n: number) => String(n).padStart(2, '0');

/**
 * Fecha como yyyy-MM-dd en hora local, como la espera el backend (LocalDate). No se usa toISOString(): pasa a UTC y
 * una fecha elegida en la noche quedaría en el día siguiente.
 */
export const fechaLocal = (fecha: Date): string =>
    `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;

/** El día de `fecha` con la hora de `hora`, como yyyy-MM-ddTHH:mm:ss en hora local (LocalDateTime del backend). */
export const fechaHoraLocal = (fecha: Date, hora: Date = new Date()): string =>
    `${fechaLocal(fecha)}T${dos(hora.getHours())}:${dos(hora.getMinutes())}:${dos(hora.getSeconds())}`;
