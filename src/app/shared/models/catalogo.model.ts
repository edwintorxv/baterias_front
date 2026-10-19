/** Catálogos simples (industrias, sectores, sexos…): CatalogoResponse del backend. */
export interface Catalogo {
    id: number;
    nombre: string;
}

export interface Departamento extends Catalogo {
    codigoDane: string;
}

export interface CiudadMunicipio extends Catalogo {
    fkDepartamento: number;
    codigoDane: string;
}

export interface Industria extends Catalogo {
    fkSectorEconomico: number;
}
