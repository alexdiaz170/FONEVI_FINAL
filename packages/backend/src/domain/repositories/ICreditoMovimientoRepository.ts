import { CreditoMovimiento } from '../entities/CreditoMovimiento.js';

export interface ICreditoMovimientoRepository {
  findByCreditoId(creditoId: string): Promise<CreditoMovimiento[]>;
  save(movimiento: CreditoMovimiento): Promise<CreditoMovimiento>;
}
