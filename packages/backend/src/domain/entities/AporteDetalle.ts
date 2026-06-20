import { Monto } from '@fonevi/shared';

export interface AporteDetalleProps {
  id?: string;
  aporteId: string;
  solidaridad: Monto;
  interes: Monto;
  seguro: Monto;
  capital: Monto;
  ahorro: Monto;
}

export class AporteDetalle {
  readonly id: string;
  readonly aporteId: string;
  readonly solidaridad: Monto;
  readonly interes: Monto;
  readonly seguro: Monto;
  readonly capital: Monto;
  readonly ahorro: Monto;

  private constructor(props: AporteDetalleProps) {
    this.id = props.id ?? crypto.randomUUID();
    this.aporteId = props.aporteId;
    this.solidaridad = props.solidaridad;
    this.interes = props.interes;
    this.seguro = props.seguro;
    this.capital = props.capital;
    this.ahorro = props.ahorro;
  }

  static create(props: AporteDetalleProps): AporteDetalle {
    return new AporteDetalle(props);
  }

  static fromPersistence(data: AporteDetalleProps): AporteDetalle {
    return new AporteDetalle(data);
  }
}
