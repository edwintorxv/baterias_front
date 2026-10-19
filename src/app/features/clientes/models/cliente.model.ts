/** ClienteResponse del backend. */
export interface Cliente {
    id: number;
    fkIndustria: number;
    fkCiudadMunicipio: number | null;
    nit: string;
    nombre: string;
    direccion: string | null;
    telefono: string | null;
    nombreContacto: string | null;
    cargoContacto: string | null;
    telefonoContacto: string | null;
}

/** ClienteRequest del backend (POST y PUT). */
export type ClienteRequest = Omit<Cliente, 'id'>;

/** Fila de la tabla: el cliente con los nombres de sus catálogos. */
export interface ClienteFila extends Cliente {
    industria: string;
    ciudad: string;
    departamento: string;
}
