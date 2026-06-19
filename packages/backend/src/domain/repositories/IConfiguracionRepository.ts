import { Configuracion } from '../entities/Configuracion.js';

export interface IConfiguracionRepository {
  findByClave(clave: string): Promise<Configuracion | null>;
  findAll(): Promise<Configuracion[]>;
  save(config: Configuracion): Promise<Configuracion>;
  delete(clave: string): Promise<void>;
}
