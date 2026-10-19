import { Catalogo } from './catalogo.model';

/** Trae el id del sector: la cascada sector → industria se filtra en el front. */
export interface Industria extends Catalogo {
    fkSectorEconomico: number;
}
