# JobConnect — Plataforma de Gestión de Talento & Reclutamiento

Panel de administración frontend para una empresa de empleabilidad y consultoría de talento humano executive. Construido con **HTML5, CSS3 Vanilla y JavaScript Módulos (ES Modules)**, consumiendo la API pública [DummyJSON](https://dummyjson.com) mediante `fetch` nativo sobre **Vite** y **pnpm**.

---

## 🌟 Características Principales

1. **Diseño Editorial Original & No Genérico**:
   - Estética inspirada en un ATS boutique / despacho ejecutivo de talento humano.
   - Tipografía híbrida: *Fraunces* (Serif variable para títulos), *Inter* (Sans-serif utilitaria para UI y datos) e *IBM Plex Mono* (Monospace para IDs y cifras numéricas).
   - Paleta rica en hueso cálido (`#F6F4EF`) y verde bosque profundo (`#1F5C4F`). Sin degradados morados ni sombras pesadas.

2. **4 Temas Visuales Intercambiables (`data-theme`)**:
   - **Claro (`light`)**: Hueso cálido + verde bosque (por defecto).
   - **Oscuro (`dark`)**: Carbón cálido + acento menta.
   - **Sepia (`sepia`)**: Tono papel envejecido para reducir la fatiga en sesiones largas.
   - **Alto Contraste (`contrast`)**: Navy + dorado de alto contraste para accesibilidad AAA.

3. **Internacionalización Reactiva (i18n)**:
   - Diccionarios en JSON (`es` / `en`) propios.
   - Cambio dinámico de idioma sin recarga de página mediante eventos reactivos y auto-traducción del DOM.

4. **Navegación Modular Sensible a Roles**:
   - Menú lateral modular (`menu.js`) que filtra accesos según el rol autenticado (`admin`, `recruiter`, `user`).

5. **Experiencia de Demo con Persistencia CRUD**:
   - Creación, actualización y eliminación de registros persistentes en `localStorage` mediante `demo-store.js`.
   - Modos de prueba inmediatos desde la pantalla de login con un solo clic.

6. **6 Módulos Operativos CRUD**:
   - 👥 **Candidatos** (`/users`): Soporta `PUT` y `PATCH`.
   - 💼 **Vacantes** (`/products`): Soporta `PUT` y `PATCH`.
   - 🏢 **Empresas** (`/carts`): Soporta `PUT`.
   - 📄 **Postulaciones** (`/posts`): Soporta `PATCH`.
   - 💬 **Entrevistas** (`/comments`): Soporta `PATCH`.
   - ☑️ **Tareas Pendientes** (`/todos`): Soporta `PATCH`.

---

## 🔑 Credenciales de Prueba por Rol (Demo)

En la pantalla de inicio de sesión puedes hacer clic directamente en los botones de acceso rápido o ingresar manualmente cualquiera de las siguientes cuentas:

### 👑 Rol Administrador (`admin`):
- **Usuario**: `emilys` | **Contraseña**: `emilyspass` *(Emily Johnson — Directora General)*
- **Usuario**: `michaelw` | **Contraseña**: `michaelwpass` *(Michael Williams — Administrador de Sistema)*

### 💼 Rol Reclutador (`recruiter`):
- **Usuario**: `sophiab` | **Contraseña**: `sophiabpass` *(Sophia Brown — Reclutadora Senior Lead)*
- **Usuario**: `jamesd` | **Contraseña**: `jamesdpass` *(James Davis — Consultor Executive)*

### 👤 Rol Usuario / Consultor Jr (`user`):
- **Usuario**: `oliviaw` | **Contraseña**: `oliviawpass` *(Olivia Wilson — Consultora de Talento Jr)*
- **Usuario**: `benjaminw` | **Contraseña**: `benjaminwpass` *(Benjamin Wilson — Analista de Reclutamiento)*

---

## 🚀 Requisitos y Puesta en Marcha

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd FWD_JobConnect

# 2. Instalar dependencias
pnpm install

# 3. Iniciar el servidor de desarrollo
pnpm dev

# 4. Compilar para producción
pnpm build
pnpm preview
```

El servidor local se iniciará en `http://localhost:3000`.
