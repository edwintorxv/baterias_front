import { EstadoAplicacion } from './formulario-aplicacion.model';

/** GET /aplicaciones/listado: una fila por aplicación de los clientes asignados, con el avance y el estado calculado. */
export interface AplicacionListado {
    id: number;
    fechaAplicacion: string;
    idCliente: number;
    cliente: string;
    idRelacion: number;
    relacionActiva: boolean;
    idEvaluado: number;
    numeroIdentificacion: string;
    nombre: string;
    apellido: string;
    /** Forma intralaboral (A o B). */
    forma: string | null;
    idEvaluador: number | null;
    evaluador: string | null;
    /** Preguntas que aplican de todos los cuestionarios del grupo y cuántas tienen respuesta. */
    aplicables: number;
    respondidas: number;
    estado: EstadoAplicacion;
}
