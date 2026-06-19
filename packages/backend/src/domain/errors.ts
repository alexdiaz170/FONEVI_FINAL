export class DomainError extends Error {
  public readonly code: string;

  constructor(message: string, code = 'DOMAIN_ERROR') {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

export class ValueObjectError extends DomainError {
  constructor(message: string, code = 'VALUE_OBJECT_ERROR') {
    super(message, code);
    this.name = 'ValueObjectError';
  }
}

export class EntityNotFoundError extends DomainError {
  public readonly entityName: string;
  public readonly entityId: string;

  constructor(entityName: string, entityId: string) {
    super(`${entityName} con id ${entityId} no encontrado`, 'ENTITY_NOT_FOUND');
    this.name = 'EntityNotFoundError';
    this.entityName = entityName;
    this.entityId = entityId;
  }
}

export class EntityAlreadyExistsError extends DomainError {
  public readonly entityName: string;
  public readonly field: string;
  public readonly value: string;

  constructor(entityName: string, field: string, value: string) {
    super(`Ya existe un ${entityName} con ${field}: ${value}`, 'ENTITY_ALREADY_EXISTS');
    this.name = 'EntityAlreadyExistsError';
    this.entityName = entityName;
    this.field = field;
    this.value = value;
  }
}

export class BusinessRuleViolationError extends DomainError {
  constructor(message: string, code = 'BUSINESS_RULE_VIOLATION') {
    super(message, code);
    this.name = 'BusinessRuleViolationError';
  }
}
