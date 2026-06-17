Auditoría Integral — Módulo de Configuración (FONEVI)
1. Resumen Ejecutivo
Estado General del Módulo
El Módulo de Configuración del sistema FONEVI presenta una implementación híbrida e incompleta. Si bien existe una interfaz visual funcional en el frontend (pages/configuracion.html) y una tabla key-value en la base de datos (configuracion), el backend carece de una capa de servicios estructurada para gestionar los parámetros. La mayor parte de la lógica financiera y de negocio crítica opera ignorando los parámetros de configuración de la base de datos, recurriendo a valores hardcodeados en el código.

Nivel de Madurez
Maturity Level: Deficiente / No Apto para Producción.
Aunque se implementa seguridad básica (JWT y restricción de rol administrador para modificar), la falta de validación de entradas, la duplicidad de la lógica de negocio y la desconexión entre el frontend y el backend en el procesamiento financiero colocan a este módulo en un estado de alto riesgo.
Fortalezas
Control de Accesos Básico: Las rutas de actualización están protegidas mediante middlewares de autenticación (requireAuth) y roles (requireRole('administrador')).
Auditoría de Modificaciones: Las modificaciones a los parámetros de configuración se registran en el log de auditoría general (accion: 'CAMBIAR_CONFIG').
Interactividad en el Frontend: El panel incluye simuladores de tasas e impacto de cartera útiles para el usuario administrador.
Debilidades
Desconexión Funcional Crítica (Valores Hardcodeados): El servicio que procesa la creación de aportes e imputación a créditos (aporteService.js) ignora los parámetros de la base de datos para rubros clave como el aporte de solidaridad (hardcodeado en $5.000) y la tasa de seguro de crédito (hardcodeada en 0.005 o 5 por mil).
Falta de Validación en el Backend: La ruta de actualización (PUT /api/configuracion/:clave) permite persistir cualquier cadena de texto en el valor de la configuración sin verificar tipos de datos (ej. tasas negativas, textos aleatorios).
Ausencia de Transaccionalidad en el Cierre de Período: El asistente de cierre de período se ejecuta de forma iterativa desde el frontend. Si ocurre una falla de red a mitad del proceso, la base de datos quedará en un estado inconsistente.
Pérdida de Información Financiera (Intereses y Seguros): La base de datos no persiste de forma independiente el desglose de intereses y seguros cobrados en los aportes; solo se guarda el capital neto pagado en la columna pago_credito del aporte.
Bug Crítico de Ejecución: El método perfil() en socioController.js produce un ReferenceError en ejecución (socio is not defined), impidiendo el acceso de los socios a su información.
Riesgos Principales
Pérdida de Integridad Financiera: Desajustes entre los cálculos de simulación (que sí leen la configuración) y la ejecución de transacciones reales (con valores hardcodeados).
Vulneración de Reglas de Negocio: Posibilidad de crear créditos con cualquier interés y monto a través de llamadas directas a la API, saltando las restricciones de antigüedad y límites de endeudamiento del frontend.
Desincronización Contable: Inconsistencia entre la tabla periodos (cuyo estado activo nunca cambia en la base de datos) y la variable periodo_actual de la tabla configuracion.
Conclusión Ejecutiva
El Módulo de Configuración NO está preparado para producción. Operar el sistema en este estado causaría errores de cálculo financiero que no coinciden con las directrices parametrizadas, pérdidas en el historial de intereses, y posibles bloqueos del sistema debido a inconsistencias de red durante los cierres mensuales.

2. Inventario de Archivos Analizados
Se ha realizado una revisión exhaustiva de los siguientes archivos en el espacio de trabajo:

Backend
schema.prisma
: Definición del modelo relacional Configuracion, Periodo, y entidades vinculadas.
configuracion.js (Rutas)
: Enrutador Express que define los endpoints de lectura y actualización.
distribucionAporte.service.js
: Lógica de simulación para la distribución de aportes mensuales basada en la configuración de la BD.
aporteService.js
: Lógica real de transacciones de aportes (contiene los valores hardcodeados).
creditoController.js
: Controlador de solicitudes y simulación de créditos (lee parcialmente la configuración).
creditoService.js
: Servicio para la creación de créditos, amortizaciones y transacciones relativas.
socioController.js
: Controlador del perfil del socio (contiene un bug de ejecución crítico).
socioService.js
: Gestión de creación y actualización de socios (carece de validaciones de aporte mínimo).
dashboard.js (Rutas)
: Visualización de métricas que utiliza un método inconsistente para buscar el período activo.
whatsapp.js (Rutas)
: Envío de recordatorios que lee el período activo directamente desde la tabla periodos ignorando la configuración general.
seed.js
: Inicialización de la base de datos con los parámetros base.
audit.js (Middleware)
: Registro de trazas de auditoría en base de datos.
auth.js (Middleware)
: Controladores de seguridad e identificación de roles.
Frontend
configuracion.html
: Interfaz de administración general, de parámetros financieros y de usuarios.
cierre-periodo.html
: Módulo frontend que orquesta el cierre del mes.
app.js
: Lógica de inicialización global de datos en el cliente.
api.js
: Cliente HTTP wrapper para llamadas REST.
3. Clasificación por Archivo
Archivo	Clasificación	Motivo y Acción Sugerida
backend/prisma/schema.prisma	Refactorizar	Es necesario extender el modelo Configuracion para soportar metadatos (tipo de dato, descripción) y agregar una entidad de historial (ConfiguracionHistorial).
backend/src/routes/configuracion.js	Refactorizar	Debe extraerse la lógica directa de base de datos a un servicio y controlador dedicados. Se deben implementar validaciones estrictas de tipo de dato para las configuraciones antes de guardarlas.
backend/src/services/distribucionAporte.service.js	Conservar	Su lógica de negocio es correcta y consume dinámicamente la configuración. Sin embargo, su estructura debe alinearse con la de aporteService.js.
backend/src/services/aporteService.js	Refactorizar	Urgente: Eliminar los valores financieros hardcodeados (aporte de solidaridad, tasa de seguro) y recuperarlos dinámicamente de la base de datos antes de registrar transacciones.
backend/src/controllers/creditoController.js	Refactorizar	Debe validar los parámetros de entrada en la creación de créditos (monto y tasaMensual) contra las configuraciones máximas y tasas oficiales parametrizadas en la base de datos.
backend/src/controllers/socioController.js	Refactorizar	Urgente: Corregir el fallo de ejecución en perfil() (ReferenceError: socio is not defined) e incluir validaciones sobre el aporte mínimo mensual en la creación de socios.
backend/src/routes/dashboard.js	Refactorizar	Cambiar la consulta del período activo para que consuma la configuración centralizada periodo_actual en lugar de hacer prisma.periodo.findFirst({ where: { activo: true } }).
backend/src/routes/whatsapp.js	Refactorizar	Alinear la obtención del período de facturación actual con la configuración del sistema.
pages/configuracion.html	Refactorizar	Retirar la funcionalidad visualmente simulada de "Cierre de Período" en la pestaña "Sistema" o redirigirla al flujo correspondiente en cierre-periodo.html para evitar confusiones al usuario.
pages/cierre-periodo.html	Refactorizar	El proceso de cierre debe ser movido en su totalidad al backend bajo un endpoint transaccional (POST /api/periodos/cierre). El frontend solo debe ser una interfaz de confirmación y presentación del resultado.
js/app.js	Refactorizar	Evitar la inicialización hardcodeada de la configuración local en el cliente. Si falla la consulta inicial de API, el sistema debe alertar al usuario en lugar de usar valores fallback obsoletos.
js/api.js	Conservar	Implementación correcta y robusta del cliente HTTP.
4. Riesgos Técnicos Detectados
Concurrencia y Transacciones
Cierre de Período Distribuido (No Atómico): El flujo en cierre-periodo.html realiza múltiples mutaciones individuales consecutivas (actualizar cada aporte a "vencido", crear un movimiento contable, cambiar el periodo de configuración). Al no estar envueltas en una transacción de base de datos única en el backend:
Si la conexión a internet del usuario falla o se cierra el navegador a mitad del proceso, la base de datos quedará en un estado parcialmente cerrado.
No existe un mecanismo de recuperación ante fallos de este tipo (Rollback).
Caché e Inconsistencias
Datos Desactualizados en el Frontend: js/app.js almacena en window.DB.config el objeto de configuración. Si un administrador modifica un parámetro financiero, otros administradores o socios con sesiones abiertas continuarán viendo y operando con los parámetros obsoletos hasta que recarguen la página por completo, ya que no hay un esquema de invalidación de caché o WebSockets.
Condiciones de Carrera (Race Conditions)
Actualización del Período: En guardarConfig() y el flujo de cierre se realizan llamadas consecutivas e independientes a la API. Si dos administradores ejecutan operaciones al mismo tiempo, el backend procesará los upsert sin bloqueos optimistas o pesimistas, lo que puede resultar en la sobreescritura de configuraciones válidas.
Configuraciones Hardcodeadas y Valores Duplicados
Valores Financieros Críticos en Código:
aporteService.js (Línea 120): let pagoSolid = 5000; (Aporte a la solidaridad).
aporteService.js (Línea 158): saldo * 0.005 (Seguro de crédito).
js/app.js (Líneas 8-19): Estructura por defecto con valores fijos que pueden diferir de los configurados en BD.
Problemas de Rendimiento
Consultas redundantes (N+1 HTTP requests): Para cerrar un período con $N$ socios pendientes, el frontend realiza $N$ llamadas HTTP PUT al backend para marcar cada aporte como vencido. Esto satura el pool de conexiones de red y de base de datos. Debe sustituirse por una sola consulta UPDATE aportes SET estado = 'vencido' WHERE periodo_id = ....
Uso de Number vs Decimal
Precisión de Punto Flotante en JavaScript: El endpoint GET /api/configuracion retorna los valores numéricos parseados con parseFloat(). En el frontend se utiliza parseFloat para enviar tasas y aportes al backend. Esto introduce errores de redondeo típicos de la especificación IEEE 754 (punto flotante de doble precisión), inaceptables en cálculos financieros contables. Se debe usar aritmética de precisión fija (Decimal/String en tránsito y base de datos).
Dependencia entre Módulos
Acoplamiento Directo en Base de Datos: Los módulos de Aportes y Créditos consumen la tabla configuracion directamente a través de consultas SQL crudas en sus respectivos archivos, en lugar de invocar a un ConfiguracionService centralizado. Esto duplica el código de obtención de parámetros en cada módulo.
5. Riesgos Funcionales Detectados
Cambio Accidental de Tasas
El endpoint de actualización PUT /api/configuracion/:clave no valida rangos lógicos de datos. Un administrador podría configurar accidentalmente una tasa de interés mensual de crédito del 100% o del -5%. La base de datos almacenará este string y los cálculos matemáticos colapsarán en el sistema.
Modificación Indebida del Período Actual
Modificar el campo periodo_actual a través de la interfaz general sin ejecutar el proceso oficial de cierre mensual alterará el estado visual de los dashboards y reportes de aportes sin haber consolidado los saldos de los socios ni haber generado los cargos del mes anterior.
Inconsistencias en Solidaridad y Seguros
Dado que aporteService.js tiene hardcodeado el descuento de solidaridad en $5.000 y el seguro de crédito en 5 por mil, si un administrador cambia en el panel de configuración el aporte a $6.000 y el seguro a 6 por mil:
El simulador del frontend y la lógica de distribucionAporte.service.js le mostrarán al socio que se le descontarán $6.000 para solidaridad.
La transacción real ejecutada por el backend en aporteService.js seguirá descontando $5.000, provocando un descuadre financiero insalvable entre lo simulado/proyectado y lo efectivamente cobrado y contabilizado en el fondo de solidaridad.
Pérdida de Configuración
La tabla configuracion usa el modelo Key-Value directo. No existen históricos. Si un administrador comete un error al configurar un parámetro, el valor anterior se pierde inmediatamente de la tabla, imposibilitando un rollback rápido o la verificación del parámetro financiero que regía en una fecha pasada.
6. Código Duplicado o Muerto Identificado
Obtención redundante de configuraciones en el Backend:

En distribucionAporte.service.js (Líneas 5-17): Se define el método obtenerConfiguracion() usando un query nativo de PostgreSQL (SELECT clave, valor FROM configuracion).
En creditoController.js (Líneas 101-113): Se duplica la misma consulta nativa SQL para obtener meses_minimos_credito.
En configuracion.js (Línea 10): Se consulta a través de Prisma Client: prisma.configuracion.findMany().
Recomendación: Crear un único ConfiguracionService reutilizable.
Inicialización redundante en el Frontend (js/app.js vs js/config.js):

En js/app.js (Líneas 8-19) se define un objeto config estático.
En pages/configuracion.html (Líneas 563-591) se configuran valores preestablecidos del HTML si no se logran cargar del local storage o base de datos.
Recomendación: La UI debe entrar en estado de carga (Skeleton/Spinner) y bloquear el uso si los parámetros del servidor no son descargados exitosamente.
7. Problemas de Arquitectura
Separación de Responsabilidades y Acoplamiento
Falta de Capas en Backend: El módulo de configuración no cuenta con un archivo controlador ni servicio especializado en el backend. Toda la lógica de obtención y upsert de parámetros está empotrada directamente en el archivo de rutas backend/src/routes/configuracion.js.
Violación de Clean Architecture: El controlador del backend interactúa directamente con la infraestructura de base de datos (prisma), exponiendo el modelo interno directamente a la respuesta HTTP sin transformarlo a un DTO adecuado.
Fallas Contables en Cierre: El asistente de cierre de período en el frontend se encarga de definir qué aportes cambian de estado y qué movimientos contables crear. Esta lógica de negocio central debería residir exclusivamente en el Domain/Service Layer del backend. El cliente no debe tener control sobre las reglas de transición de estados financieros.
8. Evaluación del Modelo de Datos
Estructura Actual de la Tabla configuracion
sql

CREATE TABLE configuracion (
  clave VARCHAR(255) PRIMARY KEY,
  valor TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
Fortalezas del Modelo
Simplicidad: La estructura Key-Value permite agregar nuevas llaves del sistema sin alterar físicamente el esquema de base de datos.
Debilidades y Limitaciones
Falta de Tipado de Datos: El campo valor es de tipo TEXT. Esto obliga a realizar casteos manuales en memoria en el backend y el frontend, arriesgando fallos catastróficos por valores nulos, caracteres extraños o formatos incorrectos.
Sin Trazabilidad de Auditoría Interna: La tabla carece de campos como usuario_id_modificacion o ip_origen. Si bien existe una tabla de auditoria general, la relación no es directa a nivel de base de datos.
Ausencia de Índices Secundarios: Al ser una tabla pequeña, el escaneo secuencial es rápido, pero carece de optimizaciones si el volumen de configuraciones por tenant creciera en el futuro.
Campos Faltantes Recomendados:
tipo_dato (string, number, boolean, date): Permite al backend validar la entrada del cliente automáticamente.
descripcion: Ayuda al administrador a comprender el propósito del parámetro en la interfaz gráfica.
categoria (financiero, general, notificaciones): Facilita la ordenación y presentación en pestañas.
9. Compatibilidad con las Reglas Oficiales de Negocio de FONEVI
A continuación se detalla la conformidad del código frente a las reglas oficiales del fondo:

Regla Oficial	Estado en Código	Brecha / Hallazgo
Valor de Solidaridad	❌ No Cumple	Hardcodeado a $5.000 en aporteService.js. Si se modifica en la configuración, los descuentos reales del socio no cambian.
Tasa Mensual de Crédito	⚠️ Parcial	Se almacena en la base de datos y se muestra en simulaciones, pero al crear un crédito (creditoController.js:create), el sistema acepta la tasa enviada por el cliente sin validar que corresponda al valor configurado.
Seguro de Crédito	❌ No Cumple	Hardcodeado a 5 por mil (0.005) en aporteService.js y socioService.js (estadoCuenta). Ignora el valor configurado en la base de datos.
Tasa de Mora Diaria	❌ No Cumple	El parámetro existe en la base de datos y el frontend, pero la lógica del backend no liquida mora automática diaria en ningún script de aportes o créditos.
Límite de Crédito	⚠️ Parcial	La restricción del cupo máximo (ej: 4 veces el ahorro) se valida únicamente en el frontend (js/comprobantes.js). El backend acepta créditos de cualquier monto sin validar la regla de ahorro multiplicado.
Período Actual	❌ No Cumple	Grave inconsistencia. El backend recupera el período activo de la tabla periodos buscando activo: true, mientras que el cierre y la configuración operan modificando la llave periodo_actual en la tabla configuracion.
Trazabilidad e Historial	❌ No Cumple	El sistema no guarda las versiones anteriores de los parámetros, impidiendo auditorías de cálculos retroactivos basados en tasas históricas.
10. Evaluación de la Administración de Configuraciones
Centralización de Parámetros (DRY)
Incumplimiento del principio DRY: Hay una gran dispersión de los parámetros. Las tasas y valores de solidaridad están duplicados en:
Base de datos (configuracion).
Frontend (js/app.js, inputs en configuracion.html).
Código fuente backend (aporteService.js como constantes estáticas).
Inconsistencia Frontend-Backend: El simulador del frontend calcula valores usando los parámetros dinámicos del servidor, mientras que el backend procesa los pagos usando números fijos. Esto derivará en reclamos legales de los socios por discrepancias en sus extractos.
11. Trazabilidad e Historial de Cambios
Diagnóstico de Trazabilidad Actual
Operación Manual: El log de auditoría (auditoria table) captura el evento CAMBIAR_CONFIG de forma plana.
Limitación: Al estar guardado en un campo de texto serializado JSON (detalle), es extremadamente ineficiente y complejo reconstruir el estado de las tasas de interés al final de un año fiscal para auditorías financieras oficiales.
Propuesta de Estructura: configuracion_historial
Para solucionar este vacío, se recomienda implementar la siguiente tabla en el esquema:

prisma

model ConfiguracionHistorial {
  id          String   @id @default(uuid())
  clave       String
  valorViejo  String   @map("valor_viejo")
  valorNuevo  String   @map("valor_nuevo")
  usuarioId   String   @map("usuario_id")
  ip          String?
  createdAt   DateTime @default(now()) @map("created_at")
  
  usuario     Usuario  @relation(fields: [usuarioId], references: [id])
  @@map("configuracion_historial")
}
Esta tabla permitirá:

Reconstruir el historial completo de cualquier parámetro de negocio.
Identificar al usuario responsable exacto de cada ajuste financiero.
Permitir una opción de Rollback instantáneo desde el panel de SuperAdmin.
12. Recomendaciones de Mejora
Inmediatas (Antes de ir a Producción)
Corregir Bug Crítico en socioController.js:
Resolver la referencia indefinida de socio en el endpoint de perfil.
Eliminar Hardcoding Financiero:
Refactorizar aporteService.js para consultar la configuración mediante Prisma o db.query antes de procesar distribuciones y cobros de seguros y solidaridad.
Mudar el Cierre de Período al Backend:
Diseñar un endpoint transaccional único (POST /api/periodos/cierre) que ejecute todos los pasos del cierre de forma atómica bajo una transacción SQL (BEGIN/COMMIT).
Validar Parámetros de Entrada:
Añadir filtros en la ruta PUT /api/configuracion/:clave para asegurar que las tasas sean numéricas y positivas.
Mediano Plazo
Validaciones en Creación de Crédito:
Validar en el backend que la tasa del crédito coincida con la tasa vigente parametrizada, y que el monto solicitado no exceda el multiplicador de ahorro acumulado del socio.
Sincronización del Período Activo:
Unificar el control de períodos. El sistema debe consumir la tabla periodos y marcar allí cuál es el único registro activo, eliminando la duplicidad en la tabla configuracion.
Persistir Desglose de Intereses y Seguros:
Modificar el modelo Aporte para agregar las columnas pago_interes y pago_seguro. Esto permitirá una contabilidad transparente y la trazabilidad del destino de fondos.
Largo Plazo
Implementar Historial de Configuraciones:
Crear la tabla configuracion_historial y el servicio de versionado de parámetros.
Capa de Abstracción de Configuración:
Implementar un patrón Singleton o servicio central de configuración con caché en memoria en el servidor, de forma que no se requiera golpear la base de datos en cada consulta de aportes/créditos.
13. Observaciones para Futura Migración
Preparación para Clean Architecture y DDD
Domain Layer: Los parámetros de configuración deben modelarse como Value Objects inmutables dentro del dominio del negocio.
Separación de Infraestructura: El origen de datos de configuración (Base de datos PostgreSQL, variables de entorno o un archivo local de configuración) debe estar aislado de las reglas de negocio centrales del fondo.
Multi-Tenant y SaaS
Configuración por Tenant: En un entorno multi-inquilino, la tabla configuracion deberá incluir una clave compuesta: (tenant_id, clave).
Versionado Financiero: Permitir a cada Fondo de Empleados personalizar de manera independiente sus tasas, multiplicadores, seguros y políticas de mora sin alterar la base de código compartida.
Panel SuperAdmin
Herramienta esencial para la gestión de tenants, inicialización de parámetros de nuevos fondos de empleados y auditoría cruzada de modificaciones en configuraciones globales de infraestructura del software.
14. Conclusión Final
¿Está listo para producción?
No. El módulo presenta fallas críticas que violan las reglas de negocio de FONEVI a nivel de transacciones reales de aportes y créditos.
Riesgos Críticos Existentes:
Descuadre contable continuo en los fondos de solidaridad y seguros por discrepancia de valores hardcodeados en el backend vs parametrizados en el frontend.
Riesgo de corrupción o estado inconsistente de datos por la falta de atomicidad en el proceso de cierre mensual.
Brecha de seguridad que permite la evasión de validaciones de cupo de crédito y tasas en la API.
Caída en ejecución del perfil del socio por un bug ReferenceError de código.
Nivel de Confiabilidad: Muy Bajo.
Recomendación Final del Auditor:
Se debe suspender cualquier despliegue a producción hasta que se apliquen las refactorizaciones de prioridad Inmediata indicadas en el apartado 12 de esta auditoría.
Fin del reporte de auditoría.

15. Hallazgos que incorporaría al plan maestro de FONEVI

A partir de todas las auditorías realizadas hasta ahora, considero prioritario implementar:

aporte_detalle para registrar el desglose de cada aporte.
credito_movimiento para conservar el historial detallado de cada crédito.
cierre_periodo para documentar cada cierre mensual con trazabilidad completa.
configuracion_historial para versionar todos los cambios de parámetros críticos.
Un ConfiguracionService centralizado consumido por todos los módulos.
Eliminación completa de constantes financieras hardcodeadas del código.