import { Socio } from '../entities/Socio.js';
import { ICodigoSocioRepository } from '../services/GeneradorCodigoSocio.js';

export interface ISocioRepository extends ICodigoSocioRepository {
  findById(id: string): Promise<Socio | null>;
  findByIdOrCodigo(idOrCodigo: string): Promise<Socio | null>;
  findByDocumento(documento: string): Promise<Socio | null>;
  findByEmail(email: string): Promise<Socio | null>;
  findAll(includeDeleted?: boolean): Promise<Socio[]>;
  findPaginated(
    page: number,
    limit: number,
    includeDeleted?: boolean,
  ): Promise<{ data: Socio[]; total: number; page: number; limit: number; totalPages: number }>;
  save(socio: Socio): Promise<Socio>;
  update(socio: Socio): Promise<Socio>;
  softDelete(id: string): Promise<void>;
  hardDelete(id: string): Promise<void>;
  count(includeDeleted?: boolean): Promise<number>;
}
