export interface ConfiguracionProps {
  clave: string;
  valor: string;
  updatedAt?: Date;
}

export class Configuracion {
  readonly clave: string;
  readonly valor: string;
  readonly updatedAt: Date;

  private constructor(props: ConfiguracionProps) {
    this.clave = props.clave;
    this.valor = props.valor;
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static create(props: ConfiguracionProps): Configuracion {
    if (!props.clave || props.clave.trim().length < 1) throw new Error('La clave es requerida');
    return new Configuracion(props);
  }

  static fromPersistence(data: ConfiguracionProps): Configuracion {
    return new Configuracion(data);
  }

  actualizarValor(nuevoValor: string): Configuracion {
    return new Configuracion({ clave: this.clave, valor: nuevoValor, updatedAt: new Date() });
  }
}
