# Auditoría de Módulo — Mi Cuenta / Perfil

> **Módulos:** Mi Cuenta (autoservicio socio) y Perfil (vista admin/tesorero/socio de un socio específico)  
> **Fecha:** 2026-06-17  
> **Rol:** Arquitecto de Software Senior / Auditor Técnico  
> **Clasificación:** 🟠 **No apto para producción (con reservas)**

---

## 1. Resumen Ejecutivo

Mi Cuenta y Perfil son dos páginas con roles y objetivos diferentes pero que comparten el mismo backend (`GET /socios/perfil` y `GET /socios/:id/estado-cuenta`). Mi Cuenta es el autoservicio del socio autenticado; Perfil es la ficha completa de un socio vista por administradores/tesoreros o por el propio socio. Ambos módulos tienen un backend funcional que devuelve datos reales del servidor, a diferencia de otros módulos (Dashboard, Panel de Mora). Sin embargo, ambos dependen de `window.DB` para datos secundarios e incluyen cálculos financieros y fechas hardcodeadas en el frontend. Mi Cuenta tiene un simulador de crédito completo que calcula tablas de amortización en el navegador pero cuyo botón "Solicitar" solo muestra un Toast sin crear realmente un crédito. Perfil permite edición inline que persiste correctamente vía API.

---

## 2. Inventario de Componentes

### 2.1 Backend — Endpoints Utilizados

| Endpoint | Propósito | Origen | Controlador | Servicio | Auditoría |
|----------|-----------|--------|-------------|----------|-----------|
| `GET /api/socios/perfil` | Datos del socio autenticado | Mi Cuenta | `socioController.perfil()` | `socioService.findByIdOrCodigo()` | ❌ |
| `GET /api/socios/:id/estado-cuenta` | Historial financiero completo | Perfil | `socioController.estadoCuenta()` | `socioService.estadoCuenta()` | ❌ |
| `PUT /api/socios/:id` | Actualizar datos del socio | Perfil (edición inline) | `socioController.update()` | `socioService.update()` | ✅ |

### 2.2 Frontend — Mi Cuenta

| Componente | Archivo | Estado |
|-----------|---------|--------|
| Página | `pages/mi-cuenta.html` | ✅ 807 líneas, completa |
| Roles | `js/roles.js:35` — `"mi-cuenta": ["socio"]` | ✅ |
| Navegación | Solo visible para rol `socio` (menú dinámico) | ✅ |
| API call principal | `API.get('/socios/perfil')` | ✅ Backend responde |
| Datos complementarios | `window.DB.socios`, `window.DB.aportes`, `window.DB.creditos`, `window.DB.config` | ⚠️ Dependencia de store global |

### 2.3 Frontend — Perfil

| Componente | Archivo | Estado |
|-----------|---------|--------|
| Página | `pages/perfil.html` | ✅ 1135 líneas, completa |
| Roles | `js/roles.js:40` — `"perfil": ["administrador","tesorero","socio"]` | ✅ |
| Navegación | Desde listado de socios + breadcrumb | ✅ |
| API call principal | `API.socios.estadoCuenta(SID, {...})` | ✅ Backend responde |
| Edición inline | `API.socios.actualizar(SID, body)` | ✅ Persiste en BD |
| Datos complementarios | `window.DB.config`, `window.DB.socios` | ⚠️ Dependencia de store global |

### 2.4 Endpoints del Backend vs Frontend

| Funcionalidad | Backend | Frontend |
|--------------|---------|----------|
| Obtener datos del socio autenticado | ✅ `GET /socios/perfil` | ✅ |
| Obtener estado de cuenta completo | ✅ `GET /socios/:id/estado-cuenta` | ✅ |
| Actualizar datos del socio | ✅ `PUT /socios/:id` | ✅ |
| Simular crédito | ❌ No existe endpoint | 🔴 Solo frontend |
| Solicitar crédito desde simulador | ❌ No existe endpoint | 🔴 Solo Toast falso |
| Persistir color de avatar | ❌ No existe | 🔴 Solo frontend |
| Calcular rendimientos estimados | ❌ No existe endpoint | 🔴 Solo frontend |

---

## 3. Clasificación de los Módulos

| Dimensión | Mi Cuenta | Perfil |
|-----------|-----------|--------|
| Arquitectura backend | 🟠 **Funcional** (1 endpoint dedicado) | 🟠 **Funcional** (2 endpoints) |
| Datos desde servidor | ✅ Datos principales vía API | ✅ Datos principales vía API |
| Cálculos financieros | 🔴 Rendimientos, simulador en frontend | 🟠 Métricas desde servidor + frontend |
| Edición de datos | ❌ No tiene (solo lectura) | ✅ Edición inline vía API |
| Persistencia de datos auxiliares | 🔴 Simulador no persiste | 🟠 Avatares no persisten |
| Experiencia de usuario | ✅ UI rica y completa | ✅ UI rica y completa |

---

## 4. Riesgos Técnicos

### RT-01: Simulador de Crédito con Botón "Solicitar" Falso (Crítico — Mi Cuenta)
- **Dónde:** `mi-cuenta.html:690-698` — `simulSolicitar()` solo muestra un Toast
- **Impacto:** Un socio puede configurar un crédito, ver la tabla de amortización completa, y creer que lo solicitó. El sistema **no crea ningún crédito**. No hay llamada API, no hay registro, no hay notificación al tesorero.
- **Código:** `Toast.success("Solicitud registrada: ... El tesorero la revisará en 24h.")` — mensaje engañoso.

### RT-02: Fechas Hardcodeadas en Cálculos (Alto — Ambos)
- **Dónde:**
  - `mi-cuenta.html:595` — `new Date("2026-03-22")` en `calcMeses()`
  - `perfil.html:1062,1129` — `new Date("2026-03-22")` en `crearGraficoAhorro()` y `mesesActivo()`
- **Impacto:** Las fechas fijas `2026-03-22` hacen que los cálculos de antigüedad y el gráfico de ahorro dejen de funcionar correctamente después de marzo 2026. El gráfico no muestra meses más recientes.

### RT-03: Dependencia de `window.DB` para Datos Secundarios (Alto — Ambos)
- **Dónde:**
  - Mi Cuenta: `DB.socios.find()` para localizar al socio (línea 340-348), `DataHelper.getAportesSocio()`, `DataHelper.getCreditosSocio()`, `DataHelper.getTotalAhorros()`, `DB.config`
  - Perfil: `DB.config` para `max_credito_multiplicador`, `tasa_credito_mensual`
- **Impacto:** Si `window.DB` no está sincronizado (polling no ha corrido aún), los datos mostrados pueden estar desactualizados. Si el socio no se encuentra en `DB.socios` por email/nombre, se usa `DB.socios[0]` como fallback (línea 348).

### RT-04: Sin Cierre de Sesión ni Refresh Token (Medio — Mi Cuenta)
- **Dónde:** `mi-cuenta.html:174-175` — solo verifica sesión con `Auth.getSession()`
- **Impacto:** Si el token expira mientras el socio navega, las llamadas API fallarán silenciosamente. No hay renovación automática de token ni redirección amigable a login.

### RT-05: Color de Avatar No Persistente (Medio — Perfil)
- **Dónde:** `perfil.html:676-687` — `cambiarColorAvatar()` solo cambia CSS en memoria
- **Impacto:** El color del avatar se pierde al recargar la página. No hay endpoint para guardar la preferencia.

### RT-06: Búsqueda de Socio por Email/Nombre Frágil (Medio — Mi Cuenta)
- **Dónde:** `mi-cuenta.html:338-349` — cuatro intentos de encontrar el socio en `DB.socios`
- **Impacto:** El método `find` por email exacto → email sin dominio → nombre → primer socio activo → `DB.socios[0]` es frágil. Si hay socios con emails similares o nombres duplicados, se puede mostrar el socio equivocado. El fallback a `DB.socios[0]` es incorrecto.

### RT-07: Gráfico de Ahorro con Proyección Lineal Simple (Bajo — Ambos)
- **Dónde:** `perfil.html:1060-1069` — acumula `aporte_mensual` mes a mes y usa `Math.min(acc, ahorroAcumulado)`
- **Impacto:** El gráfico asume que el socio siempre ha aportado el mismo monto mensual. No considera cambios de aporte, retiros parciales, ni créditos. La línea es una estimación, no un dato real.

---

## 5. Riesgos Funcionales

### RF-01: Solicitud de Crédito desde Simulador No Funciona (Crítico — Mi Cuenta)
- **Dónde:** `mi-cuenta.html:690-698`
- **Impacto:** El socio completa todo el flujo de simulación y cree haber solicitado un crédito, pero el sistema no registra nada. Pérdida de confianza del usuario.

### RF-02: Cálculo de Rendimientos no Real (Alto — Mi Cuenta)
- **Dónde:** `mi-cuenta.html:417,524-547` — `rendMensual = ahorro * (tasa/100)`
- **Impacto:** El rendimiento mostrado (mensual y anual) es una estimación lineal simple. No refleja la rentabilidad real del fondo. Puede crear expectativas falsas en el socio.

### RF-03: Capacidad de Crédito Calculada en Frontend (Alto — Ambos)
- **Dónde:** `mi-cuenta.html:442-444` — `maxCred = ahorro * multiplicador - deuda`
- **Impacto:** La capacidad de crédito se calcula en el navegador. Si hay discrepancia entre `window.DB` y la BD, el socio ve una capacidad incorrecta.

### RF-04: Sin Historial de Inicios de Sesión (Medio — Mi Cuenta)
- **Dónde:** No hay registro de cuándo el socio inició sesión por última vez
- **Impacto:** El socio no puede ver su actividad reciente ni detectar accesos no autorizados.

---

## 6. Código Duplicado

| Patrón | Archivos | Líneas |
|--------|----------|--------|
| `new Date("2026-03-22")` hardcodeado | `mi-cuenta.html:595`, `perfil.html:1062,1129` | 3 ocurrencias |
| `fmtM()` helper idéntico | `mi-cuenta.html:588-592`, `perfil.html:1122-1126` | ~5 c/u |
| Lógica de capacidad de crédito (`ahorro * multiplicador - deuda`) | `mi-cuenta.html:442-444`, `perfil.html:903-904`, `mi-cuenta.html:611` (simulador) | 3 ocurrencias |
| Filtro `["mora","vencido"].includes(a.estado)` | Ambos archivos | Múltiples |

---

## 7. Evaluación de Arquitectura

### 7.1 Capas: 🟠 Funcional con Limitaciones

Ambas páginas tienen un backend que responde con datos reales. Sin embargo:

| Aspecto | Evaluación |
|---------|-----------|
| Datos del socio vienen del servidor | ✅ `GET /socios/perfil` y `GET /socios/:id/estado-cuenta` |
| Datos complementarios de `window.DB` | ⚠️ Necesario pero frágil |
| Operaciones de escritura vía API | ✅ Perfil: `PUT /socios/:id` |
| Operaciones de escritura simuladas | 🔴 Mi Cuenta: simulador sin POST |

### 7.2 Seguridad: 🟠 Parcial

| Aspecto | Estado |
|---------|--------|
| Autenticación en backend | ✅ `requireAuth` en rutas |
| Roles correctos (solo socio) | ✅ Mi Cuenta: solo rol socio |
| Roles correctos (admin/tesorero/socio) | ✅ Perfil: roles amplios |
| Protección de datos de otros socios | ✅ Mi Cuenta usa `req.usuario.socioId` |
| Auditoría en escritura | ✅ `PUT /socios/:id` tiene middleware audit |
| Auditoría en lecturas | ❌ No hay registro de consultas |

### 7.3 Mantenibilidad: 🟠 Aceptable

Ambas páginas tienen código bien estructurado, con funciones claras. El principal problema es la dependencia de fechas hardcodeadas y la duplicación de lógica entre ambos archivos.

---

## 8. Modelo de Datos

### 8.1 Modelos Relacionados

| Modelo | Uso | Estado |
|--------|-----|--------|
| `Socio` | Datos personales, ahorro, estado | ✅ |
| `Aporte` | Historial de aportes con paginación | ✅ |
| `Credito` | Créditos del socio | ✅ |
| `Periodo` | Nombre de período para aportes | ✅ |
| `SolidaridadMovimiento` | Ayudas recibidas (beneficiario) | ✅ |

### 8.2 Modelos Faltantes

| Modelo | Uso |
|--------|-----|
| `SolicitudCredito` | Persistir solicitudes generadas desde el simulador |
| `PreferenciaSocio` | Color de avatar, notificaciones, tema |

---

## 9. Reglas de Negocio

### 9.1 Ubicación Actual

| Regla | Ubicación | Estado |
|-------|-----------|--------|
| Capacidad de crédito = ahorro × multiplicador − deuda | Frontend (ambos) + Backend (solo en `socioController.perfil()` no tiene esto) | 🟠 En frontend |
| Rendimiento mensual = ahorro × tasa / 100 | Frontend (`mi-cuenta.html:417`) | 🔴 En frontend |
| Solicitar crédito = mostrar Toast | Frontend (`mi-cuenta.html:697`) | 🔴 Falso |
| Edición de datos personales | Backend (`PUT /socios/:id`) | ✅ |

### 9.2 Problemas

1. **La regla más importante (solicitar crédito) es falsa**: el simulador no crea nada
2. **Cálculos financieros no auditables**: rendimientos y capacidad son locales al navegador
3. **Fechas hardcodeadas**: el sistema está anclado a marzo 2026

---

## 10. KPIs de los Módulos

| KPI | Mi Cuenta | Perfil |
|-----|-----------|--------|
| Endpoints backend dedicados | 1 (`GET /perfil`) | 2 (`GET /estado-cuenta`, `PUT /:id`) |
| Operaciones de solo lectura desde servidor | ✅ Parcial | ✅ Parcial |
| Operaciones de escritura reales | ❌ Ninguna | ✅ Edición inline |
| Cálculos financieros en servidor | ❌ 0% | ❌ 0% |
| Persistencia de datos de usuario | ❌ | 🟠 Parcial (datos sí, avatar no) |
| Fechas hardcodeadas | 1 (`2026-03-22`) | 2 (`2026-03-22`) |

---

## 11. Trazabilidad

| Aspecto | Estado |
|---------|--------|
| Lectura de perfil | ❌ No auditada |
| Lectura de estado de cuenta | ❌ No auditada |
| Actualización de datos | ✅ Auditada vía `PUT /socios/:id` |
| Solicitud de crédito (simulador) | ❌ No existe |
| Cambio de contraseña | No evaluado (página separada) |

---

## 12. Recomendaciones

### Inmediatas (Prioridad Crítica)

| # | Recomendación | Esfuerzo | Impacto |
|---|--------------|----------|---------|
| R1 | **Eliminar el botón "Solicitar" falso:** Reemplazar con redirección a formulario de solicitud real o crear endpoint `POST /api/creditos/solicitar`. Hasta implementarlo, deshabilitar el botón con mensaje "Próximamente" | 1-2 días | RF-01, RT-01 |
| R2 | **Reemplazar fecha hardcodeada por `new Date()`:** Cambiar las 3 ocurrencias de `"2026-03-22"` por `new Date()` o por `DB.config.fecha_actual` | 30 min | RT-02 |
| R3 | **Agregar endpoint `GET /api/socios/:id/capacidad`:** Mover el cálculo de capacidad de crédito al servidor | 1 día | RF-03 |

### Corto Plazo (30 días)

| # | Recomendación | Esfuerzo | Impacto |
|---|--------------|----------|---------|
| R4 | **Agregar endpoint `POST /api/creditos/solicitar`:** Crear modelo `SolicitudCredito` y endpoint para que el simulador realmente persista solicitudes | 2-3 días | RF-01 |
| R5 | **Mejorar búsqueda del socio autenticado en Mi Cuenta:** Usar `req.usuario.socioId` directamente desde el backend en lugar de buscar en `DB.socios` | 1 día | RT-06 |
| R6 | **Persistir preferencias de avatar:** Agregar modelo o columna `preferencias` en `Socio` y endpoint `PUT /socios/:id/preferencias` | 1 día | RT-05 |
| R7 | **Agregar endpoint de rendimientos:** Crear `GET /api/socios/:id/rendimientos` que calcule rendimientos con la fórmula real del fondo | 2-3 días | RF-02 |
| R8 | **Agregar registro de último acceso:** Mostrar fecha de último login en Mi Cuenta | 1 día | RF-04 |

### Mejoras Adicionales

| # | Recomendación | Esfuerzo | Impacto |
|---|--------------|----------|---------|
| R9 | **Agregar selector de período para el gráfico de ahorro:** Permitir ver evolución por año seleccionable | 1 día | UX |
| R10 | **Compartir lógica entre Mi Cuenta y Perfil:** Extraer componentes comunes (hero, crédito card, timeline) a funciones compartidas en `js/perfil.js` | 2 días | Mantenibilidad |

---

## 13. Plan de Migración

### Fase 0: Correcciones Urgentes (Días 1-2)

```
Día 1:
  ├── R1: Deshabilitar botón "Solicitar" del simulador hasta tener endpoint real
  ├── R2: Reemplazar "2026-03-22" por new Date() en ambos archivos
  └── R5: Usar req.usuario.socioId en Mi Cuenta (backend ya lo tiene)

Día 2:
  ├── R3: Endpoint GET /api/socios/:id/capacidad
  └── R8: Mostrar último acceso en Mi Cuenta
```

### Fase 1: Funcionalidad Completa (Semana 2-3)

```
Semana 2:
  ├── R4: Modelo SolicitudCredito + POST /api/creditos/solicitar
  └── R6: Preferencias de avatar

Semana 3:
  ├── R7: Endpoint de rendimientos reales
  └── R10: Refactor para compartir componentes
```

---

## 14. Conclusión

**Clasificación final: 🟠 No apto para producción (con reservas)**

Mi Cuenta y Perfil son los módulos mejor construidos de FONEVI en términos de consumo de API backend. A diferencia de Dashboard o Panel de Mora, estos módulos obtienen sus datos principales desde el servidor y tienen operaciones de escritura reales (Perfil).

Sin embargo, tienen problemas críticos que impiden considerarlos listos para producción:

1. **El simulador de crédito de Mi Cuenta es un señuelo**: el socio cree solicitar un crédito pero solo ve un Toast. Esto es un riesgo funcional y de confianza muy grave (RF-01).
2. **Fechas hardcodeadas a marzo 2026**: los cálculos de antigüedad y el gráfico de ahorro están congelados en el tiempo (RT-02).
3. **Cálculos financieros en frontend**: capacidad de crédito, rendimientos estimados y proyecciones se calculan en el navegador (RF-03, RF-02).

**Fortalezas:**
- UX rica y profesional en ambas páginas
- Perfil permite edición inline con persistencia real
- Paginación de aportes en Perfil funciona correctamente
- Buenos detalles visuales (avatar, badges, barras de progreso)

**Veredicto:** Ambos módulos están cerca de ser aceptables. Con 2-3 días de trabajo (corregir simulador, fechas, capacidad de crédito), Mi Cuenta podría pasar a 🟡 Aceptable con observaciones. Perfil ya está más cerca. El simulador de crédito es el punto más crítico porque **promete una funcionalidad que no entrega**.

## Auditoría de Mi Cuenta/Perfil guardada en docs/auditorias/AUDITORIA_MI_CUENTA_PERFIL.md. 
### Clasificación: 🟠 No apto para producción (con reservas).

Hallazgos principales:
- Simulador de crédito con botón "Solicitar" falso — Muestra un Toast pero no crea ningún crédito (RF-01 crítico)
- Fechas hardcodeadas — "2026-03-22" en 3 lugares; cálculos congelados en marzo 2026
- Capacidad de crédito calculada en frontend, no en servidor
- Búsqueda de socio frágil — Mi Cuenta busca por email/nombre en DB.socios con fallback a DB.socios[0]
- Color de avatar no persistente — Se pierde al recargar página
Positivo: Son los módulos mejor construidos de FONEVI — datos principales vienen del servidor, edición inline persiste, UI profesional. Con ~3 días de trabajo quedarían aceptables.
