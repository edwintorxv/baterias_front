import { Catalogo } from './catalogo.model';

/** Trae el grupo ocupacional (1 → forma A, 2 → forma B) para avisar si la forma elegida no coincide. */
export interface TipoCargo extends Catalogo {
    fkGrupoOcupacional: number;
}
