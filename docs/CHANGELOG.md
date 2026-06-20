# CHANGELOG.md

# Historial Oficial de Cambios – FONEVI

Este documento registra los cambios relevantes realizados en el proyecto FONEVI.

Su objetivo es proporcionar una referencia clara de la evolución funcional, técnica y arquitectónica del sistema.

---

# Formato

Cada entrada deberá incluir, cuando sea posible:

- Fecha.
- Versión.
- Tipo de cambio.
- Descripción.
- Impacto.

Tipos sugeridos:

- **Added** → Nueva funcionalidad.
- **Changed** → Cambio de comportamiento.
- **Fixed** → Corrección de errores.
- **Removed** → Eliminación de funcionalidades.
- **Security** → Mejoras de seguridad.
- **Docs** → Cambios en documentación.
- **Refactor** → Refactorizaciones sin cambios funcionales.

---

# Versión 1.0.0 (En desarrollo)

## Added

- Entidad `AporteDetalle` para trazabilidad de distribución de aportes.
- Endpoint `GET /api/creditos/calcular` con previsualización de tabla de amortización.
- Método `calcularCuotaFijaConSeguro` en `CalculadorCuota` para cuota fija combinada.
- `ConfirmDialog` genérico reemplazando `confirm()` nativo en SociosLista y AportesLista.

## Changed

- **Cálculo de cuota de crédito**: ahora usa `r_combinada = interés + seguro` (0.0105).
  Cuota fija = Capital + Interés + Seguro (completamente fija).
- `TASA_SEGURO` corregida de 0.05/1000 a **0.5/1000** (0.5‰).
- `RegistrarAporteUseCase`: `tasaSeguro` ahora divide por `/ 1000` (no `/ 100`).
  Lee `valor_ahorro_mensual` de la DB y aplica Regla #2 (ahorro mensual fijo antes de capital).
- Filtro de créditos en reportes y estado de cuenta: ahora solo incluye `['activo', 'pagado']`,
  excluyendo `pendiente`. El perfil de socio solo retorna `estado: 'activo'`.
- Movimiento `categoria` ahora muestra `Cuota Normal`, `Adelanto Cuotas` o `Abono Crédito`
  (sin prefijo `aporte:`). `descripcion` solo muestra el periodo (ej: `Enero 2026`).
- Redondeo de tabla de amortización: todos los valores a enteros (sin decimales).

## Fixed

- Créditos en estado `pendiente` ya no se consideran activos en distribución de aportes.
- Seguro mal calculado en tabla de amortización (factor 10x).
- `ObtenerEstadoCuentaSocioUseCase` ya no devuelve créditos `pagado` como activos.
- `ObtenerCarteraUseCase` filtra por `['activo', 'pagado']`.
- Movimientos existentes en BD corregidos (prefijo `aporte:` eliminado).

## Docs

- `REGLAS_DE_NEGOCIO.md`: sección 3.2 actualizada con fórmula exacta de cuota fija
  combinada, redondeo a enteros y distribución interna por período.
- `CHANGELOG.md`: historial de esta sesión.

## Added

- Implementación del módulo de autenticación.
- Gestión de socios.
- Gestión de aportes.
- Gestión de créditos.
- Panel administrativo.
- Portal de consulta para socios.
- Indicadores financieros.
- Carné digital.
- Generación de estados de cuenta.
- Generación de paz y salvo.

## Changed

- Definición oficial del flujo de distribución de aportes para socios con crédito.
- Inclusión de modalidades diferenciadas de pago:

  - Pago normal.
  - Adelanto de cuotas.
  - Abono extraordinario al ahorro acumulado.
  - Abono extraordinario a capital de crédito.

## Docs

Se inició la documentación estructural del proyecto con los siguientes documentos:

- README.
- ARQUITECTURA_FONEVI.
- DECISIONES_DE_ARQUITECTURA.
- ROLES_Y_PERMISOS.
- CONFIGURACION.
- FLUJO_APORTES.
- FLUJO_CREDITOS.
- FLUJO_CIERRE_PERIODO.
- BACKUPS.
- SEGURIDAD.
- ROADMAP.
- CHANGELOG.

## Planned

Se planificó para futuras versiones:

- Panel SuperAdmin para administración de parámetros financieros.
- Configuración dinámica almacenada en base de datos.
- Asistente de Cierre Mensual guiado.
- Simulación previa del cierre mensual.
- Integración del cierre con verificación de respaldos.
- Estrategia avanzada de recuperación ante desastres.
- Refactorización del modelo de aportes mediante una estructura de detalle (`aporte_detalle` o equivalente).
- Refinanciación de créditos.
- Posible incorporación de autenticación de dos factores para usuarios privilegiados.

---

# Política de mantenimiento

Este archivo deberá actualizarse únicamente cuando existan cambios relevantes que afecten:

- Funcionalidad.
- Arquitectura.
- Seguridad.
- Modelo de datos.
- Procesos de negocio.
- Documentación oficial.

Los cambios menores de estilo o mantenimiento rutinario no requieren una nueva entrada.

---

# Objetivo

Mantener una trazabilidad clara de la evolución del sistema para facilitar auditorías, mantenimiento, soporte y futuras mejoras.
