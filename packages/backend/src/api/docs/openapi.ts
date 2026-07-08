export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'FONEVI API',
    version: '1.0.0',
    description: `API del Fondo de Empleados Docentes FONEVI.

## Autenticación
La mayoría de endpoints requieren autenticación mediante JWT.
Incluir el header \`Authorization: Bearer <token>\` obtenido de \`POST /auth/login\`.

## Roles
- **socio**: Acceso a sus propios datos y dashboard
- **admin**: Gestión de socios, aportes, créditos
- **superadmin**: Acceso completo, gestión de usuarios`,
    contact: { name: 'FONEVI' },
  },
  servers: [{ url: '/', description: 'Servidor actual' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', enum: [false] },
          mensaje: { type: 'string' },
          codigo: { type: 'string' },
          detalles: { type: 'object' },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@fonevi.com' },
          password: { type: 'string', example: '123456' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', enum: [true] },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              refreshToken: { type: 'string' },
              usuario: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  nombre: { type: 'string' },
                  email: { type: 'string' },
                  rol: { type: 'string', enum: ['admin', 'socio', 'superadmin', 'contador'] },
                },
              },
            },
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['nombre', 'email', 'password'],
        properties: {
          nombre: { type: 'string', minLength: 2, maxLength: 200 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          rol: { type: 'string', enum: ['admin', 'socio'], default: 'socio' },
        },
      },
      CrearSocioRequest: {
        type: 'object',
        required: ['nombre', 'tipoDocumento', 'numeroDocumento'],
        properties: {
          nombre: { type: 'string', minLength: 2, maxLength: 200 },
          tipoDocumento: { type: 'string', enum: ['CC', 'CE', 'NIT', 'PASAPORTE'] },
          numeroDocumento: { type: 'string' },
          email: { type: 'string', format: 'email' },
          telefono: { type: 'string', pattern: '^\\d{7,10}$' },
          fechaIngreso: { type: 'string', format: 'date-time' },
          aporteMensual: { type: 'number', minimum: 0 },
          ahorroAcumulado: { type: 'number', minimum: 0 },
          estado: {
            type: 'string',
            enum: ['activo', 'mora', 'retirado', 'suspendido'],
            default: 'activo',
          },
          cargo: { type: 'string' },
          sede: { type: 'string' },
          departamento: { type: 'string' },
          municipio: { type: 'string' },
        },
      },
      CrearAporteRequest: {
        type: 'object',
        required: ['socioId', 'periodoId', 'monto'],
        properties: {
          socioId: { type: 'integer' },
          periodoId: { type: 'integer' },
          monto: { type: 'number', exclusiveMinimum: 0 },
          fechaPago: { type: 'string', format: 'date' },
          estado: {
            type: 'string',
            enum: ['pendiente', 'pagado', 'mora', 'vencido', 'anulado'],
            default: 'pagado',
          },
          tipoOperacion: {
            type: 'string',
            enum: ['cuota_normal', 'abono_credito', 'adelanto_cuotas'],
          },
          metodo: { type: 'string', maxLength: 50 },
          notas: { type: 'string', maxLength: 500 },
        },
      },
      SolicitarCreditoRequest: {
        type: 'object',
        required: ['socioId', 'monto', 'cuotas'],
        properties: {
          socioId: { type: 'integer' },
          monto: { type: 'number', exclusiveMinimum: 0 },
          tasaMensual: { type: 'number', exclusiveMinimum: 0, maximum: 100 },
          cuotas: { type: 'integer', minimum: 1 },
          fechaDesembolso: { type: 'string', format: 'date' },
          proposito: { type: 'string' },
          notas: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Salud'],
        summary: 'Verificar estado del servidor',
        responses: {
          '200': {
            description: 'Servidor funcionando',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: { estado: { type: 'string' }, timestamp: { type: 'string' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
          },
        },
        responses: {
          '200': {
            description: 'Login exitoso',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } },
            },
          },
          '401': {
            description: 'Credenciales inválidas',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Autenticación'],
        summary: 'Registrar nuevo usuario',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } },
          },
        },
        responses: {
          '201': { description: 'Usuario creado' },
          '400': {
            description: 'Datos inválidos',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Autenticación'],
        summary: 'Renovar token de acceso',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Token renovado' } },
      },
    },
    '/auth/profile': {
      get: {
        tags: ['Autenticación'],
        summary: 'Obtener perfil del usuario autenticado',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Perfil del usuario' } },
      },
    },
    '/auth/password': {
      put: {
        tags: ['Autenticación'],
        summary: 'Cambiar contraseña',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Contraseña actualizada' } },
      },
    },

    '/api/socios': {
      get: {
        tags: ['Socios'],
        summary: 'Listar socios (paginado)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 9999 } },
          {
            name: 'buscar',
            in: 'query',
            schema: { type: 'string' },
            description: 'Búsqueda por nombre o documento',
          },
        ],
        responses: { '200': { description: 'Lista de socios' } },
      },
      post: {
        tags: ['Socios'],
        summary: 'Crear nuevo socio',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CrearSocioRequest' } },
          },
        },
        responses: {
          '201': { description: 'Socio creado' },
          '400': { description: 'Datos inválidos' },
        },
      },
    },
    '/api/socios/all': {
      get: {
        tags: ['Socios'],
        summary: 'Listar todos los socios (sin paginación)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Lista completa' } },
      },
    },
    '/api/socios/{id}': {
      get: {
        tags: ['Socios'],
        summary: 'Obtener socio por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Datos del socio' },
          '404': { description: 'No encontrado' },
        },
      },
      put: {
        tags: ['Socios'],
        summary: 'Actualizar socio',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                  email: { type: 'string' },
                  telefono: { type: 'string' },
                  estado: { type: 'string', enum: ['activo', 'mora', 'retirado', 'suspendido'] },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Socio actualizado' } },
      },
      delete: {
        tags: ['Socios'],
        summary: 'Eliminar socio',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Socio eliminado' },
          '404': { description: 'No encontrado' },
        },
      },
    },

    '/api/aportes': {
      get: {
        tags: ['Aportes'],
        summary: 'Listar aportes',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'socioId', in: 'query', schema: { type: 'integer' } },
          { name: 'periodoId', in: 'query', schema: { type: 'integer' } },
          {
            name: 'estado',
            in: 'query',
            schema: { type: 'string', enum: ['pendiente', 'pagado', 'mora', 'vencido', 'anulado'] },
          },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
        ],
        responses: { '200': { description: 'Lista de aportes' } },
      },
      post: {
        tags: ['Aportes'],
        summary: 'Registrar aporte',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CrearAporteRequest' } },
          },
        },
        responses: { '201': { description: 'Aporte registrado' } },
      },
    },
    '/api/aportes/{id}': {
      get: {
        tags: ['Aportes'],
        summary: 'Obtener aporte por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Datos del aporte' } },
      },
      put: {
        tags: ['Aportes'],
        summary: 'Actualizar aporte',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Aporte actualizado' } },
      },
      delete: {
        tags: ['Aportes'],
        summary: 'Eliminar aporte',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Aporte eliminado' } },
      },
    },
    '/api/aportes/periodos': {
      get: {
        tags: ['Aportes'],
        summary: 'Listar períodos disponibles',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Lista de períodos' } },
      },
    },

    '/api/creditos': {
      get: {
        tags: ['Créditos'],
        summary: 'Listar créditos',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'socioId', in: 'query', schema: { type: 'integer' } },
          { name: 'estado', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
        ],
        responses: { '200': { description: 'Lista de créditos' } },
      },
      post: {
        tags: ['Créditos'],
        summary: 'Solicitar nuevo crédito',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SolicitarCreditoRequest' },
            },
          },
        },
        responses: { '201': { description: 'Crédito creado' } },
      },
    },
    '/api/creditos/resumen': {
      get: {
        tags: ['Créditos'],
        summary: 'Resumen de créditos',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Resumen' } },
      },
    },
    '/api/creditos/calcular': {
      get: {
        tags: ['Créditos'],
        summary: 'Calcular simulación de crédito',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'monto', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'cuotas', in: 'query', required: true, schema: { type: 'integer' } },
          { name: 'tasaMensual', in: 'query', schema: { type: 'number' } },
        ],
        responses: { '200': { description: 'Simulación' } },
      },
    },
    '/api/creditos/{id}': {
      get: {
        tags: ['Créditos'],
        summary: 'Obtener crédito por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Datos del crédito' } },
      },
    },
    '/api/creditos/{id}/aprobar': {
      post: {
        tags: ['Créditos'],
        summary: 'Aprobar crédito',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Crédito aprobado' } },
      },
    },
    '/api/creditos/{id}/rechazar': {
      post: {
        tags: ['Créditos'],
        summary: 'Rechazar crédito',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Crédito rechazado' } },
      },
    },
    '/api/creditos/{id}/pagar': {
      post: {
        tags: ['Créditos'],
        summary: 'Pagar cuota',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { fechaPago: { type: 'string', format: 'date' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Cuota pagada' } },
      },
    },
    '/api/creditos/{id}/amortizacion': {
      get: {
        tags: ['Créditos'],
        summary: 'Tabla de amortización',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Tabla de amortización' } },
      },
    },
    '/api/creditos/{id}/pagos': {
      get: {
        tags: ['Créditos'],
        summary: 'Historial de pagos',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Historial de pagos' } },
      },
    },
    '/api/creditos/capacidad/{socioId}': {
      get: {
        tags: ['Créditos'],
        summary: 'Capacidad de crédito del socio',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'socioId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Capacidad de crédito' } },
      },
    },

    '/api/movimientos': {
      get: {
        tags: ['Movimientos'],
        summary: 'Listar movimientos',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'tipo', in: 'query', schema: { type: 'string', enum: ['ingreso', 'egreso'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
        ],
        responses: { '200': { description: 'Lista de movimientos' } },
      },
      post: {
        tags: ['Movimientos'],
        summary: 'Registrar movimiento',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tipo', 'categoria', 'descripcion', 'monto'],
                properties: {
                  tipo: { type: 'string', enum: ['ingreso', 'egreso'] },
                  categoria: { type: 'string', minLength: 2 },
                  descripcion: { type: 'string', minLength: 3 },
                  monto: { type: 'number', exclusiveMinimum: 0 },
                  fecha: { type: 'string', format: 'date' },
                  socioId: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Movimiento registrado' } },
      },
    },

    '/api/dashboard/resumen': {
      get: {
        tags: ['Dashboard'],
        summary: 'Resumen del dashboard (admin)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Resumen' } },
      },
    },
    '/api/dashboard/balance': {
      get: {
        tags: ['Dashboard'],
        summary: 'Balance general',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Balance' } },
      },
    },

    '/api/notificaciones': {
      get: {
        tags: ['Notificaciones'],
        summary: 'Listar notificaciones',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'leida', in: 'query', schema: { type: 'boolean' } },
          { name: 'tipo', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
        ],
        responses: { '200': { description: 'Lista de notificaciones' } },
      },
      post: {
        tags: ['Notificaciones'],
        summary: 'Crear notificación',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tipo', 'titulo', 'mensaje'],
                properties: {
                  tipo: { type: 'string' },
                  titulo: { type: 'string', minLength: 2 },
                  mensaje: { type: 'string', minLength: 3 },
                  urgente: { type: 'boolean' },
                  referenciaId: { type: 'integer' },
                  referenciaTipo: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Notificación creada' } },
      },
    },
    '/api/notificaciones/{id}/leer': {
      patch: {
        tags: ['Notificaciones'],
        summary: 'Marcar como leída',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Notificación marcada' } },
      },
    },

    '/api/solidaridad': {
      get: {
        tags: ['Solidaridad'],
        summary: 'Listar movimientos de solidaridad',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { '200': { description: 'Lista' } },
      },
      post: {
        tags: ['Solidaridad'],
        summary: 'Registrar movimiento de solidaridad',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tipo', 'descripcion', 'monto'],
                properties: {
                  tipo: { type: 'string', enum: ['ingreso', 'egreso'] },
                  descripcion: { type: 'string', minLength: 3 },
                  monto: { type: 'number', exclusiveMinimum: 0 },
                  fecha: { type: 'string', format: 'date' },
                  beneficiario: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Movimiento registrado' } },
      },
    },

    '/api/mora': {
      get: {
        tags: ['Mora'],
        summary: 'Listar socios en mora',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Lista de mora' } },
      },
    },
    '/api/mora/acuerdos': {
      get: {
        tags: ['Mora'],
        summary: 'Listar acuerdos de pago',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Lista de acuerdos' } },
      },
      post: {
        tags: ['Mora'],
        summary: 'Crear acuerdo de pago',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['socioId', 'montoTotal', 'cuotas'],
                properties: {
                  socioId: { type: 'integer' },
                  montoTotal: { type: 'number', exclusiveMinimum: 0 },
                  cuotas: { type: 'integer', minimum: 1 },
                  fechaInicio: { type: 'string', format: 'date' },
                  notas: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Acuerdo creado' } },
      },
    },

    '/api/dividendos': {
      get: {
        tags: ['Dividendos'],
        summary: 'Listar dividendos',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Lista' } },
      },
      post: {
        tags: ['Dividendos'],
        summary: 'Crear dividendo',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['periodo', 'montoTotal'],
                properties: {
                  periodo: { type: 'string' },
                  montoTotal: { type: 'number', exclusiveMinimum: 0 },
                  fechaCalculo: { type: 'string', format: 'date' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Dividendo creado' } },
      },
    },
    '/api/dividendos/{id}': {
      get: {
        tags: ['Dividendos'],
        summary: 'Obtener dividendo',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Datos del dividendo' } },
      },
    },
    '/api/dividendos/{id}/distribuir': {
      post: {
        tags: ['Dividendos'],
        summary: 'Distribuir dividendo entre socios',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['socioIds'],
                properties: {
                  socioIds: { type: 'array', items: { type: 'integer' }, minItems: 1 },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Dividendo distribuido' } },
      },
    },

    '/api/configuracion': {
      get: {
        tags: ['Configuración'],
        summary: 'Listar configuraciones',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Lista de configuraciones' } },
      },
    },
    '/api/configuracion/{clave}': {
      get: {
        tags: ['Configuración'],
        summary: 'Obtener configuración por clave',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'clave', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Valor de la configuración' } },
      },
      put: {
        tags: ['Configuración'],
        summary: 'Actualizar configuración',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'clave', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['valor'],
                properties: { valor: { type: 'string', minLength: 1 } },
              },
            },
          },
        },
        responses: { '200': { description: 'Configuración actualizada' } },
      },
    },

    '/api/auditoria': {
      get: {
        tags: ['Auditoría'],
        summary: 'Listar registros de auditoría',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'usuarioId', in: 'query', schema: { type: 'integer' } },
          { name: 'tabla', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Lista de auditoría' } },
      },
    },

    '/api/reportes/balance-general': {
      get: {
        tags: ['Reportes'],
        summary: 'Balance general',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Balance general' } },
      },
    },
    '/api/reportes/cartera': {
      get: {
        tags: ['Reportes'],
        summary: 'Reporte de cartera',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Cartera' } },
      },
    },
    '/api/reportes/flujo-caja': {
      get: {
        tags: ['Reportes'],
        summary: 'Flujo de caja',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'desde', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'hasta', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { '200': { description: 'Flujo de caja' } },
      },
    },
    '/api/reportes/estado-cuenta/{socioId}': {
      get: {
        tags: ['Reportes'],
        summary: 'Estado de cuenta del socio',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'socioId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Estado de cuenta' } },
      },
    },

    '/api/periodos': {
      get: {
        tags: ['Períodos'],
        summary: 'Listar períodos',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Lista de períodos' } },
      },
      post: {
        tags: ['Períodos'],
        summary: 'Crear período',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre', 'anio', 'mes'],
                properties: {
                  nombre: { type: 'string', minLength: 3 },
                  anio: { type: 'integer', minimum: 2000, maximum: 2100 },
                  mes: { type: 'integer', minimum: 1, maximum: 12 },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Período creado' } },
      },
    },
    '/api/periodos/activo': {
      get: {
        tags: ['Períodos'],
        summary: 'Obtener período activo',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Período activo' } },
      },
    },
    '/api/periodos/{id}/activar': {
      post: {
        tags: ['Períodos'],
        summary: 'Activar período',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Período activado' } },
      },
    },

    '/api/cierre-periodo/validar': {
      post: {
        tags: ['Cierre de Período'],
        summary: 'Validar cierre de período',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Validación completada' } },
      },
    },
    '/api/cierre-periodo/simular': {
      post: {
        tags: ['Cierre de Período'],
        summary: 'Simular cierre de período',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Simulación completada' } },
      },
    },
    '/api/cierre-periodo/ejecutar': {
      post: {
        tags: ['Cierre de Período'],
        summary: 'Ejecutar cierre de período',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Cierre ejecutado' } },
      },
    },

    '/api/whatsapp/enviar': {
      post: {
        tags: ['WhatsApp'],
        summary: 'Enviar mensaje WhatsApp',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['numero', 'template'],
                properties: {
                  numero: { type: 'string' },
                  template: { type: 'string' },
                  variables: { type: 'object', additionalProperties: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Mensaje enviado' } },
      },
    },
    '/api/whatsapp/logs': {
      get: {
        tags: ['WhatsApp'],
        summary: 'Listar logs de WhatsApp',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'estado', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Logs' } },
      },
    },
    '/api/whatsapp/estado': {
      get: {
        tags: ['WhatsApp'],
        summary: 'Estado de la conexión WhatsApp',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Estado de conexión' } },
      },
    },

    '/api/usuarios': {
      get: {
        tags: ['Usuarios'],
        summary: 'Listar usuarios del sistema',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Lista de usuarios' } },
      },
      post: {
        tags: ['Usuarios'],
        summary: 'Crear usuario del sistema',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre', 'email', 'password', 'rol'],
                properties: {
                  nombre: { type: 'string', minLength: 2, maxLength: 200 },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  rol: { type: 'string', enum: ['admin', 'socio', 'superadmin', 'contador'] },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Usuario creado' } },
      },
    },
    '/api/usuarios/{id}': {
      put: {
        tags: ['Usuarios'],
        summary: 'Actualizar usuario',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string', minLength: 6 },
                  rol: { type: 'string', enum: ['admin', 'socio', 'superadmin', 'contador'] },
                  estado: { type: 'string', enum: ['activo', 'inactivo'] },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Usuario actualizado' } },
      },
      delete: {
        tags: ['Usuarios'],
        summary: 'Eliminar usuario',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Usuario eliminado' } },
      },
    },

    '/api/backup/generar': {
      get: {
        tags: ['Backup'],
        summary: 'Generar backup de la base de datos',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Archivo JSON con todos los datos',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },

    '/api/exportar/{tipo}/{formato}': {
      get: {
        tags: ['Exportar'],
        summary: 'Exportar datos a Excel o PDF',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'tipo',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              enum: [
                'dashboard',
                'balance-general',
                'cartera',
                'solidaridad',
                'acuerdos-pago',
                'socios',
                'creditos',
                'aportes',
                'movimientos',
                'flujo-caja',
                'estado-cuenta',
                'pagos-credito',
              ],
            },
          },
          {
            name: 'formato',
            in: 'path',
            required: true,
            schema: { type: 'string', enum: ['xlsx', 'pdf'] },
          },
        ],
        responses: { '200': { description: 'Archivo exportado' } },
      },
    },
  },
};
