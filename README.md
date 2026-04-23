# SI Learning Red

> Simulador interactivo de redes para la enseñanza de Sistemas de Información — protocolos, firewall, NAT y laboratorios guiados con validación automática.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-5.19-2D3748?logo=prisma)
![License](https://img.shields.io/badge/license-MIT-green)

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

| Capa           | Tecnología                                          |
| -------------- | --------------------------------------------------- |
| Frontend       | Next.js 14 (App Router) · React 18 · TypeScript     |
| UI             | Tailwind CSS · Lucide Icons · Framer Motion         |
| Canvas         | React Flow 11 (nodos y edges customizados)          |
| Estado         | Zustand                                             |
| Backend        | Express · TypeScript · JWT (access + refresh)       |
| ORM            | Prisma 5                                            |
| Base de datos  | SQLite (dev, zero-config) · PostgreSQL (producción) |
| Monorepo       | npm workspaces                                      |
| Infra opcional | Docker Compose                                      |

---

## Estructura del monorepo

```
si-learning-red/
├── apps/
│   ├── web/                  # Next.js PWA
│   │   └── src/
│   │       ├── app/          # Rutas (App Router)
│   │       ├── components/   # simulator/, labs/, dashboard/, ui/
│   │       └── lib/
│   │           ├── engine/   # packet-engine, lab-validator, topology-templates
│   │           └── store/    # Zustand stores
│   └── api/                  # Express REST API
│       └── src/
│           ├── routes/       # auth, labs, courses, progress
│           ├── middleware/   # auth, validate, errorHandler
│           └── prisma/       # schema, seed
├── packages/
│   └── shared/               # Tipos TypeScript + schemas Zod compartidos
├── docker-compose.yml
└── package.json
```

---

## Requisitos previos

- **Node.js** >= 18
- **npm** >= 9
- **Docker** (solo para modo PostgreSQL)

---

## Inicio rápido — SQLite (sin Docker)

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/si-learning-red.git
cd si-learning-red

# 2. Instalar dependencias
npm install

# 3. Variables de entorno (ya configuradas para SQLite)
cp apps/api/.env.example apps/api/.env

# 4. Levantar todo con un solo comando
npm run dev
```

`npm run dev` automáticamente:

1. Genera el cliente Prisma para SQLite
2. Aplica el schema (`prisma db push`)
3. Ejecuta el seed con usuarios y labs de ejemplo
4. Inicia la API en **http://localhost:3001** y el frontend en **http://localhost:3000**

### Cuentas del seed

| Email            | Contraseña    | Rol      |
| ---------------- | ------------- | -------- |
| `admin@si.edu`   | `password123` | Admin    |
| `teacher@si.edu` | `password123` | Profesor |
| `student@si.edu` | `password123` | Alumno   |

---

## Modo PostgreSQL (con Docker)

```bash
# Editar apps/api/.env y cambiar DATABASE_URL a:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/si_learning_red?schema=public"

npm run dev:pg
```

---

## Variables de entorno

`apps/api/.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="cambia-esto-en-produccion"
JWT_REFRESH_SECRET="cambia-esto-tambien"
PORT=3001
```

`apps/web/.env.local` (opcional):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Scripts disponibles

| Comando                    | Descripción                           |
| -------------------------- | ------------------------------------- |
| `npm run dev`              | API + Web en modo desarrollo (SQLite) |
| `npm run dev:pg`           | Docker + API + Web (PostgreSQL)       |
| `npm run build`            | Build de todos los paquetes           |
| `npm run db:seed`          | Poblar la base de datos               |
| `npm run db:studio`        | Abrir Prisma Studio                   |
| `npm run db:sqlite:studio` | Prisma Studio con SQLite              |
| `npm run lint`             | ESLint en todos los paquetes          |

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
- Validación automática: config, ping, routing, firewall, connectivity, device_count
- Checklist pre-lab en tiempo real
- Pistas opcionales por paso
- Puntuación automática al completar
- Progreso sincronizado con la API

### 📊 Dashboards

- **Alumno**: estadísticas personales, 8 insignias/logros desbloqueables
- **Profesor**: promedio real de puntuaciones, exportar reporte PDF (`window.print()`)

### 🔐 Autenticación

- JWT con refresh tokens
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
