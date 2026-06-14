# SI Learning Red

> Simulador interactivo de redes para la enseñanza de Sistemas de Información — protocolos, firewall, NAT y laboratorios guiados con validación automática.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-5.19-2D3748?logo=prisma)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Tabla de contenidos

1. [¿Qué es?](#qué-es)
2. [Stack tecnológico](#stack-tecnológico)
3. [Estructura del monorepo](#estructura-del-monorepo)
4. [Requisitos técnicos para ejecución local](#requisitos-técnicos-para-ejecución-local)
5. [Variables de entorno](#variables-de-entorno)
6. [Instalación y arranque](#instalación-y-arranque)
7. [Puertos utilizados](#puertos-utilizados)
8. [Scripts disponibles](#scripts-disponibles)
9. [Usuarios de prueba (seed)](#usuarios-de-prueba-seed)
10. [Funcionalidades principales](#funcionalidades-principales)
11. [Roles de usuario](#roles-de-usuario)
12. [Notas adicionales](#notas-adicionales)
13. [Contribuir](#contribuir)
14. [Licencia](#licencia)

---

## ¿Qué es?

**SI Learning Red** es una plataforma educativa web que permite a alumnos y profesores de redes:

- **Construir topologías** de red visualmente (drag & drop) con PCs, routers, switches, servidores y firewalls.
- **Simular protocolos** en tiempo real: ICMP (ping), ARP, DNS, DHCP y HTTP — con animación de paquetes y vista en capas OSI.
- **Configurar seguridad**: reglas de firewall (ACL) y NAT/PAT con resultado aplicado en la simulación.
- **Completar laboratorios guiados** con validación automática del estado de la red (IPs, rutas, ping, firewall).
- **Gestionar cursos y progreso** con roles diferenciados: Alumno, Profesor y Admin.

---

## Capturas de pantalla

| Simulador                            | Lab en ejecución                   | Dashboard alumno         |
| ------------------------------------ | ---------------------------------- | ------------------------ |
| _(canvas con topología drag & drop)_ | _(split canvas + pasos validados)_ | _(insignias + progreso)_ |

---

## Stack tecnológico

| Capa           | Tecnología                                                   | Versión        |
| -------------- | ------------------------------------------------------------ | -------------- |
| Frontend       | Next.js (App Router) · React · TypeScript                    | ^16.2.9 / ^18.3.1 / ^5.5.0 |
| UI             | Tailwind CSS · Lucide React · Framer Motion                  | ^3.4.7 / ^0.424.0 / ^11.3.0 |
| Canvas         | React Flow (nodos y edges customizados)                      | ^11.11.4       |
| Estado         | Zustand                                                      | ^4.5.4         |
| Backend        | Express · TypeScript · JWT (access + refresh)                | ^4.21.0 / ^5.5.0 / ^9.0.2 |
| ORM            | Prisma                                                       | ^5.19.0        |
| Validación     | Zod                                                          | ^3.23.8        |
| Runtime TS     | tsx                                                          | ^4.16.0        |
| Tests          | Vitest                                                       | ^4.1.5         |
| BD desarrollo  | SQLite (archivo local, zero-config)                          | —              |
| BD producción  | PostgreSQL                                                   | 16-alpine      |
| Monorepo       | npm workspaces                                               | —              |
| Infra opcional | Docker Compose                                               | —              |

---

## Estructura del monorepo

```
si-learning-red/                  ← raíz (npm workspaces)
├── apps/
│   ├── web/                      ← Next.js PWA  →  puerto 3000
│   │   └── src/
│   │       ├── app/              # Rutas (App Router)
│   │       ├── components/       # simulator/, labs/, dashboard/, ui/
│   │       └── lib/
│   │           ├── engine/       # packet-engine, lab-validator, topology-templates
│   │           └── store/        # Zustand stores
│   └── api/                      ← Express REST API  →  puerto 3001
│       └── src/
│           ├── routes/           # auth, labs, courses, progress
│           ├── middleware/       # auth, validate, errorHandler
│           └── prisma/           # schema, seed
├── packages/
│   └── shared/                   ← Tipos TypeScript + schemas Zod compartidos
├── docker-compose.yml            ← PostgreSQL 16-alpine (solo modo pg)
└── package.json
```

---

## Requisitos técnicos para ejecución local

### Herramientas obligatorias

| Herramienta | Versión mínima | Notas                          |
| ----------- | -------------- | ------------------------------ |
| **Node.js** | >= 18.0.0      | LTS recomendado (20.x)         |
| **npm**     | >= 9.0.0       | Incluido con Node.js           |
| **Git**     | cualquiera     | Para clonar el repositorio     |

### Herramientas opcionales (solo modo PostgreSQL)

| Herramienta        | Versión | Notas                                         |
| ------------------ | ------- | --------------------------------------------- |
| **Docker**         | cualquiera | Para levantar PostgreSQL via `docker compose` |
| **Docker Compose** | v2+     | Incluido en Docker Desktop                    |

> El modo por defecto usa **SQLite** (archivo local `dev.db`), sin necesidad de Docker ni ningún servidor de base de datos externo.

---

## Variables de entorno

### `apps/api/.env` — **requerido**

Crear copiando desde el ejemplo:

```bash
cp apps/api/.env.example apps/api/.env
```

Contenido completo para **modo SQLite** (por defecto):

```env
# ─── Modo SQLite (por defecto, sin Docker) ───
DATABASE_URL="file:./dev.db"

JWT_SECRET="change-this-to-a-secure-random-string"
JWT_REFRESH_SECRET="change-this-to-another-secure-random-string"
PORT=3001
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000"
```

Para **modo PostgreSQL**, cambiar únicamente `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/si_learning_red?schema=public"
```

### `apps/web/.env.local` — opcional

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

> Si no se crea, el frontend asume `http://localhost:3001` por defecto.

---

## Instalación y arranque

### Modo SQLite — sin Docker _(recomendado para desarrollo)_

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd si-learning-red

# 2. Instalar todas las dependencias del monorepo
npm install

# 3. Crear archivo de entorno
cp apps/api/.env.example apps/api/.env

# 4. Levantar todo con un solo comando
npm run dev
```

`npm run dev` ejecuta automáticamente en orden:

1. Genera el cliente Prisma para SQLite
2. Aplica el schema (`prisma db push`)
3. Ejecuta el seed con usuarios y labs de ejemplo
4. Inicia la API en **http://localhost:3001**
5. Inicia el frontend en **http://localhost:3000**

### Modo PostgreSQL — con Docker

```bash
# 1-3. Igual que arriba, pero editar apps/api/.env con la URL de PostgreSQL

# 4. Levantar Docker + API + Web en paralelo
npm run dev:pg
```

`npm run dev:pg` lanza concurrently:
- `docker compose up` → PostgreSQL en puerto 5432
- `npm run dev -w apps/api` → API Express
- `npm run dev -w apps/web` → Next.js

---

## Puertos utilizados

| Servicio             | Puerto | URL                         |
| -------------------- | ------ | --------------------------- |
| Frontend (Next.js)   | 3000   | http://localhost:3000       |
| API (Express)        | 3001   | http://localhost:3001       |
| PostgreSQL (Docker)  | 5432   | solo disponible en `dev:pg` |

---

## Scripts disponibles

| Comando                      | Descripción                                     |
| ---------------------------- | ----------------------------------------------- |
| `npm run dev`                | API + Web en modo desarrollo (SQLite, sin Docker)|
| `npm run dev:pg`             | Docker + API + Web con PostgreSQL               |
| `npm run dev:web`            | Solo el frontend Next.js                        |
| `npm run dev:api`            | Solo la API Express                             |
| `npm run build`              | Build de todos los paquetes                     |
| `npm run build:web`          | Build solo del frontend                         |
| `npm run build:api`          | Build solo de la API                            |
| `npm run test`               | Tests en todos los paquetes                     |
| `npm run test:web`           | Tests del frontend                              |
| `npm run test:api`           | Tests de la API                                 |
| `npm run lint`               | ESLint en todos los paquetes                    |
| `npm run db:seed`            | Re-ejecutar el seed (PostgreSQL)                |
| `npm run db:migrate`         | Ejecutar migraciones Prisma (PostgreSQL)        |
| `npm run db:studio`          | Abrir Prisma Studio (PostgreSQL)                |
| `npm run db:sqlite:studio`   | Abrir Prisma Studio (SQLite)                    |

---

## Usuarios de prueba (seed)

| Email              | Contraseña    | Rol      |
| ------------------ | ------------- | -------- |
| `admin@si.edu`     | `password123` | Admin    |
| `teacher@si.edu`   | `password123` | Profesor |
| `student@si.edu`   | `password123` | Alumno   |

---

## Funcionalidades principales

### 🖥️ Simulador de redes

- Canvas drag & drop con React Flow
- Dispositivos: PC, Router, Switch, Server, Firewall
- Protocolos simulados: **PING (ICMP)**, **ARP**, **DNS**, **DHCP**, **HTTP**
- Inspector de paquetes con capas OSI
- Firewall con reglas ACL aplicadas en la simulación
- Tabla de enrutamiento estático (longest-prefix match)
- NAT/PAT
- Controles de reproducción (play/pause/velocidad)
- Persistencia en `localStorage`
- Exportar/importar topología como JSON
- **5 plantillas precargadas**: red simple, switch, router+2 subredes, firewall+DMZ, DHCP+DNS

### 🧪 Laboratorios guiados

- Layout split: canvas a la izquierda, pasos a la derecha
- Validación automática: `config`, `ping`, `routing`, `firewall`, `connectivity`, `device_count`
- Checklist pre-lab en tiempo real
- Pistas opcionales por paso
- Puntuación automática al completar
- Progreso sincronizado con la API

### 📊 Dashboards

- **Alumno**: estadísticas personales, 8 insignias/logros desbloqueables
- **Profesor**: promedio real de puntuaciones, exportar reporte PDF (`window.print()`)

### 🔐 Autenticación

- JWT con access token + refresh token
- Refresh tokens almacenados en cookies HTTP-only
- Recuperación de contraseña (token en consola en dev, listo para SMTP en prod)
- Roles: `STUDENT`, `TEACHER`, `ADMIN`

---

## Roles de usuario

| Rol          | Permisos                                                            |
| ------------ | ------------------------------------------------------------------- |
| **Admin**    | Gestión total del sistema                                           |
| **Profesor** | Crear/editar labs y cursos, ver progreso de alumnos, exportar PDF   |
| **Alumno**   | Realizar labs, ver su progreso e insignias, usar el simulador libre |

---

## Notas adicionales

- **Windows**: los scripts usan `cross-env` para compatibilidad de variables de entorno entre plataformas, no se necesita configuración extra.
- **Dos schemas de Prisma**: `apps/api/prisma/schema.prisma` (PostgreSQL) y `apps/api/prisma/schema.sqlite.prisma` (SQLite). El comando `npm run dev` usa automáticamente el de SQLite.
- **Base de datos SQLite existente**: el archivo `apps/api/prisma/dev.db` ya existe en el repositorio con datos de seed previos. Para un estado limpio, eliminar ese archivo antes de ejecutar `npm run dev`.
- **CORS**: la API solo acepta peticiones desde `http://localhost:3000` por defecto (configurable mediante `CORS_ORIGIN` en el `.env`).
- **Monorepo**: todas las dependencias se instalan desde la raíz con un único `npm install` gracias a npm workspaces. No es necesario instalar dependencias en cada subcarpeta.

---

## Contribuir

1. Haz fork del repositorio
2. Crea una rama: `git checkout -b feature/mi-mejora`
3. Commitea tus cambios: `git commit -m 'feat: descripción breve'`
4. Haz push: `git push origin feature/mi-mejora`
5. Abre un Pull Request

### Convención de commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     nueva funcionalidad
fix:      corrección de bug
docs:     cambios en documentación
style:    formato, sin cambios de lógica
refactor: refactorización de código
chore:    tareas de mantenimiento
```

---

## Licencia

MIT © 2024 — SI Learning Red
