# FONEVI — Sistema de Gestión del Fondo de Empleados Docentes

<div align="center">

![FONEVI](https://img.shields.io/badge/FONEVI-v1.0.0-0f2d52?style=for-the-badge&logoColor=white)
![Estado](https://img.shields.io/badge/Estado-En%20desarrollo-c9922a?style=for-the-badge)
![Licencia](https://img.shields.io/badge/Licencia-MIT-1d9e75?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-≥18.0-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

**Sistema web completo para la administración financiera de fondos de empleados docentes.**

[Demo en vivo](#) · [Reportar un bug](../../issues) · [Solicitar función](../../issues)

</div>

---

## Tabla de contenidos

- [Descripción](#descripción)
- [Capturas de pantalla](#capturas-de-pantalla)
- [Tecnologías](#tecnologías)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación rápida](#instalación-rápida)
- [Credenciales de demostración](#credenciales-de-demostración)
- [Módulos del sistema](#módulos-del-sistema)
- [API REST](#api-rest)
- [Variables de entorno](#variables-de-entorno)
- [Despliegue](#despliegue)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

---

## Descripción

FONEVI es un sistema de gestión financiera diseñado para fondos de empleados docentes. Permite administrar aportes mensuales, créditos, fondo de solidaridad, dividendos y generar reportes financieros completos, todo desde una interfaz web moderna con soporte para modo oscuro, PWA móvil y notificaciones por WhatsApp.

### Características principales

- **Control de acceso por roles** — Administrador, Tesorero y Socio con vistas diferenciadas
- **Dashboard financiero** — KPIs en tiempo real, gráficos Chart.js, resumen ejecutivo
- **Gestión de socios** — CRUD completo, perfil detallado, estado de cuenta individual
- **Módulo de aportes** — Registro, historial, estado por período
- **Módulo de créditos** — Solicitud, aprobación, tabla de amortización, pago de cuotas
- **Exportación PDF/Excel** — Reportes profesionales con logo institucional, sin backend
- **WhatsApp Business API** — Notificaciones automáticas de aportes, créditos y mora
- **PWA instalable** — Funciona en celular como app nativa, modo offline incluido
- **Modo oscuro** — Toggle con transición suave, persiste la preferencia del usuario
- **Skeletons y transiciones** — Animaciones de carga y navegación fluida entre páginas

---

## Tecnologías

### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| HTML5 / CSS3 / JS | Vanilla | Base de la aplicación |
| Chart.js | 4.4.0 | Gráficos financieros |
| jsPDF | 2.5.1 | Exportación a PDF |
| SheetJS (XLSX) | 0.18.5 | Exportación a Excel |
| Service Worker | — | PWA y modo offline |

### Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Node.js | ≥18.0 | Entorno de ejecución |
| Express | 4.18.2 | Framework HTTP |
| PostgreSQL | 15+ | Base de datos |
| JWT | 9.0.2 | Autenticación |
| bcryptjs | 2.4.3 | Hash de contraseñas |
| node-cron | 3.0.3 | Tareas programadas |
| Helmet | 7.1.0 | Seguridad HTTP |

### Integraciones
| Servicio | Uso |
|----------|-----|
| Meta WhatsApp Cloud API v19 | Notificaciones automáticas |
| Railway / Render | Despliegue en producción |

---

## Estructura del proyecto

```
FONEVI/
│
├── FONEVI_FINAL/               # Frontend (abrir index.html con Live Server)
│   ├── index.html              # Login
│   ├── favicon.svg
│   ├── manifest.json           # PWA manifest
│   ├── browserconfig.xml       # Compatibilidad Windows
│   │
│   ├── css/
│   │   ├── main.css            # Sistema de diseño principal
│   │   ├── dashboard.css       # Estilos del panel
│   │   ├── login.css           # Estilos del login
│   │   ├── darkmode.css        # Tema oscuro completo
│   │   ├── loading.css         # Skeletons y spinners
│   │   └── transitions.css     # Animaciones de navegación
│   │
│   ├── js/
│   │   ├── data.js             # Base de datos simulada (modo offline)
│   │   ├── api.js              # Cliente HTTP con fallback offline
│   │   ├── auth.js             # Autenticación
│   │   ├── roles.js            # Control de acceso por rol (RBAC)
│   │   ├── layout.js           # Sidebar y topbar dinámicos
│   │   ├── app.js              # Toast, Modal, utilidades
│   │   ├── charts.js           # Gráficos Chart.js
│   │   ├── darkmode.js         # Gestor modo oscuro
│   │   ├── loading.js          # Sistema de skeletons
│   │   ├── transitions.js      # Transiciones de página
│   │   └── export.js           # Exportación PDF y Excel
│   │
│   ├── pages/
│   │   ├── dashboard.html      # Panel principal (admin/tesorero)
│   │   ├── mi-cuenta.html      # Vista personal del socio
│   │   ├── socios.html         # Gestión de socios
│   │   ├── perfil.html         # Perfil detallado del socio
│   │   ├── aportes.html        # Módulo de aportes
│   │   ├── creditos.html       # Módulo de créditos
│   │   ├── solidaridad.html    # Fondo de solidaridad
│   │   ├── dividendos.html     # Distribución de dividendos
│   │   ├── contabilidad.html   # Movimientos contables
│   │   ├── reportes.html       # Generación de reportes
│   │   ├── notificaciones.html # Centro de notificaciones
│   │   ├── whatsapp-panel.html # Panel WhatsApp Business
│   │   ├── auditoria.html      # Registro de auditoría
│   │   └── configuracion.html  # Configuración del sistema
│   │
│   ├── app/                    # PWA móvil (socio)
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── sw.js
│   │
│   └── icons/                  # Íconos PWA (13 tamaños)
│
└── fonevi-server/              # Backend Node.js + Express
    ├── server.js
    ├── package.json
    ├── .env.example
    │
    ├── database/
    │   ├── schema.sql          # Esquema completo de la BD
    │   ├── seed.sql            # Datos de prueba
    │   └── migrations/         # Migraciones incrementales
    │
    └── src/
        ├── app.js              # Configuración Express
        ├── config/             # DB y JWT
        ├── controllers/        # Lógica de negocio
        ├── middlewares/        # Auth y manejo de errores
        ├── routes/             # Definición de rutas
        └── services/
            ├── whatsapp.js     # WhatsApp Cloud API
            └── scheduler.js    # Cron jobs automáticos
```

---

## Instalación rápida

### Opción A — Solo frontend (sin servidor)

El frontend funciona completamente sin backend usando datos simulados (`data.js`).

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/fonevi.git
cd fonevi

# 2. Abrir en VS Code
code FONEVI_FINAL/

# 3. Instalar extensión Live Server en VS Code
# 4. Clic derecho en index.html → "Open with Live Server"
# 5. Abrir http://127.0.0.1:5500
```

### Opción B — Frontend + Backend completo

**Requisitos previos:** Node.js ≥18, PostgreSQL ≥15

```bash
# ── Backend ──────────────────────────────────────────────────
cd fonevi-server

# Instalar dependencias
npm install

# Configurar entorno
cp .env.example .env
# Editar .env con tus datos de PostgreSQL y JWT

# Crear la base de datos
psql -U postgres -c "CREATE DATABASE fonevi_db;"

# Inicializar tablas y datos de prueba
npm run db:init
npm run db:seed

# Iniciar servidor (http://localhost:3000)
npm run dev

# ── Frontend ──────────────────────────────────────────────────
# En otra terminal, abrir FONEVI_FINAL/index.html con Live Server
# El frontend detecta automáticamente si el servidor está corriendo
```

---

## Credenciales de demostración

| Usuario | Correo | Contraseña | Acceso |
|---------|--------|-----------|--------|
| Carlos Muñoz | `admin@fonevi.edu.co` | `admin123` | Total — todos los módulos |
| Laura Jiménez | `tesorero@fonevi.edu.co` | `tesorer123` | Financiero — sin configuración del sistema |
| Ana Torres | `ana.torres@fonevi.edu.co` | `socio123` | Personal — solo su información |

> ⚠️ **Cambiar estas contraseñas antes de pasar a producción.**

---

## Módulos del sistema

### Para Administrador y Tesorero
| Módulo | Descripción |
|--------|-------------|
| 📊 Dashboard | KPIs financieros, gráficos de aportes vs créditos, actividad reciente |
| 👥 Socios | CRUD completo, filtros por estado, enlace al perfil individual |
| 💰 Aportes | Registro por período, estados (pagado/pendiente/mora), exportar PDF/Excel |
| 💳 Créditos | Solicitud, tabla de amortización, pago de cuotas, cartera en tiempo real |
| 🤝 Solidaridad | Fondo de ayuda, solicitudes y desembolsos |
| 🎁 Dividendos | Cálculo y distribución anual de utilidades |
| 📊 Contabilidad | Movimientos de ingresos y egresos |
| 📈 Reportes | 6 tipos de reportes exportables en PDF y Excel |
| 🔔 Notificaciones | Centro de avisos internos |
| 💬 WhatsApp | Panel de envíos automáticos y manuales |
| 🔐 Auditoría | Registro de todas las acciones del sistema |
| ⚙️ Configuración | Tasas, períodos y parámetros del fondo |

### Solo para el Rol Socio
| Módulo | Descripción |
|--------|-------------|
| 👤 Mi Cuenta | Ahorro acumulado, rendimientos, crédito activo, capacidad disponible |
| 📋 Mis Aportes | Historial personal de pagos con estados |
| ℹ️ Info del Fondo | Tasas, aporte mínimo, datos públicos del fondo |
| 📱 App Móvil | PWA instalable en celular con modo offline |

---

## API REST

Base URL: `http://localhost:3000/api`

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| POST | `/auth/login` | Iniciar sesión | Público |
| GET | `/auth/perfil` | Perfil del usuario | Autenticado |
| GET | `/dashboard/resumen` | KPIs principales | Staff |
| GET/POST | `/socios` | Listar / Crear socio | Staff |
| GET/PUT | `/socios/:id` | Ver / Actualizar socio | Staff |
| GET | `/socios/:id/estado-cuenta` | Estado de cuenta | Staff |
| GET/POST | `/aportes` | Listar / Registrar aporte | Staff |
| GET/POST | `/creditos` | Listar / Crear crédito | Staff |
| POST | `/creditos/:id/pagar-cuota` | Registrar pago de cuota | Staff |
| GET | `/creditos/simular` | Simular crédito | Staff |
| GET | `/whatsapp/estado` | Estado de la conexión WA | Staff |
| POST | `/whatsapp/recordatorios` | Enviar recordatorios masivos | Staff |
| POST | `/whatsapp/alertas-mora` | Enviar alertas de mora | Staff |
| POST | `/whatsapp/test` | Mensaje de prueba | Admin |
| GET | `/api/health` | Estado del servidor | Público |

> Todos los endpoints protegidos requieren el header: `Authorization: Bearer <token>`

---

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fonevi_db
DB_USER=postgres
DB_PASSWORD=tu_password

# JWT — generar con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=secreto_muy_largo_y_seguro_minimo_64_caracteres
JWT_EXPIRES_IN=8h

# Frontend (CORS)
FRONTEND_URL=http://localhost:5500

# WhatsApp Business (opcional)
WA_TOKEN=token_permanente_de_meta
WA_PHONE_ID=id_del_numero_de_negocio
WA_WEBHOOK_VERIFY_TOKEN=fonevi2026
```

Ver `README.whatsapp.md` para la guía completa de configuración de WhatsApp.

---

## Despliegue

### Railway (recomendado)

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Iniciar sesión
railway login

# 3. Crear proyecto
railway init

# 4. Agregar PostgreSQL
railway add --plugin postgresql

# 5. Configurar variables de entorno en el dashboard de Railway

# 6. Desplegar
railway up
```

### Variables requeridas en producción

```
NODE_ENV=production
DATABASE_URL=<provisto por Railway automáticamente>
JWT_SECRET=<secreto largo y aleatorio>
FRONTEND_URL=https://tu-dominio.com
```

---

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz un **fork** del repositorio
2. Crea una rama para tu función: `git checkout -b feature/nueva-funcion`
3. Confirma tus cambios: `git commit -m 'Agrega nueva función'`
4. Sube la rama: `git push origin feature/nueva-funcion`
5. Abre un **Pull Request**

### Convenciones de commits

```
feat:     Nueva funcionalidad
fix:      Corrección de bug
docs:     Cambios en documentación
style:    Cambios de formato (sin lógica)
refactor: Refactorización de código
test:     Agregar o modificar tests
```

---

## Licencia

Distribuido bajo la licencia MIT. Ver [`LICENSE`](LICENSE) para más información.

---

## Contacto

**Fondo de Empleados Docentes FONEVI**
- NIT: 800.123.456-7
- Representante: Carlos Alberto Muñoz

---

<div align="center">

Hecho con ❤️ para los docentes

**[⬆ Volver arriba](#fonevi--sistema-de-gestión-del-fondo-de-empleados-docentes)**

</div>
