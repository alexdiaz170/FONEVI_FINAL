import { Periodo } from '../entities/Periodo.js';

export interface IPeriodoRepository {
  findById(id: number): Promise<Periodo | null>;
  findByNombre(nombre: string): Promise<Periodo | null>;
  findActivo(): Promise<Periodo | null>;
  findAll(): Promise<Periodo[]>;
  save(periodo: Periodo): Promise<Periodo>;
  update(periodo: Periodo): Promise<Periodo>;
}
