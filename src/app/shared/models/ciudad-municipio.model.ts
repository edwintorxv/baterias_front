import { Catalogo } from './catalogo.model';

/** Trae el id del departamento (no el objeto): las cascadas departamento → ciudad se filtran en el front. */
export interface CiudadMunicipio extends Catalogo {
    fkDepartamento: number;
    codigoDane: string;
}
