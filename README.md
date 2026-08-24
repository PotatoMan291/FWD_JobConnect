# JobConnect — Plataforma de Gestión de Talento & Reclutamiento

https://trello.com/invite/b/6a8c704a6dd01d94771e59d6/ATTI02f0ba902b3c38d717911b7365aca21195E1C4B4/jobconnect-plan-de-trabajo
Panel de administración completo con arquitectura **Servidor Unificado Node.js (Express)** e interfaz **Frontend en Vanilla JS (HTML5 + CSS3 + Módulos ES)**.

---

## Arquitectura de la Aplicación

```
┌────────────────────────────────────────────────────────────┐
│  SERVIDOR UNIFICADO NODE.JS (Express: Puerto 4000)        │
│  `server.js`                                               │
├──────────────────────────────┬─────────────────────────────┤
│  Frontend (Páginas Estáticas)│  Backend (REST APIs)        │
│  • HTML5 + Vanilla CSS3      │  • /api/auth/login          │
│  • Módulos ES & Assets SVG   │  • /api/users, /api/products│
│  • i18n reactivo (ES/EN)     │  • /api/carts, /api/posts   │
│  • 4 temas (data-theme)      │  • /api/comments, /api/todos│
└──────────────────────────────┴─────────────────────────────┘
```

---

## Características

1. **Servidor Único Node.js / Express (`server.js`)**:
   - Entrega estática de páginas web y recursos (`express.static('.')`).
   - REST APIs nativas en `/api/*`.

2. **Diseño Editorial Original & No Genérico**:
   - Tipografía híbrida (*Fraunces*, *Inter*, *IBM Plex Mono*).
   - Paleta sobria de hueso cálido (`#F6F4EF`) y verde bosque profundo (`#1F5C4F`).

3. **4 Temas Visuales (`data-theme`)**:
   - `light`, `dark`, `sepia` y `contrast`.

4. **Internacionalización Reactiva (i18n)**:
   - Traduce dinámicamente todo el DOM al alternar entre español e inglés (`es` / `en`).

---

## Credenciales de Prueba por Rol (Demo)

En la pantalla de inicio de sesión puedes usar los botones de acceso rápido o ingresar cualquiera de las siguientes cuentas:

### Rol Administrador (`admin`):
- **Usuario**: `emilys` | **Contraseña**: `emilyspass` *(Emily Johnson — Directora General)*
- **Usuario**: `michaelw` | **Contraseña**: `michaelwpass` *(Michael Williams — Administrador de Sistema)*

### Rol Reclutador (`recruiter`):
- **Usuario**: `sophiab` | **Contraseña**: `sophiabpass` *(Sophia Brown — Reclutadora Senior Lead)*
- **Usuario**: `jamesd` | **Contraseña**: `jamesdpass` *(James Davis — Consultor Executive)*

### Rol Usuario / Consultor Jr (`user`):
- **Usuario**: `oliviaw` | **Contraseña**: `oliviawpass` *(Olivia Wilson — Consultora de Talento Jr)*
- **Usuario**: `benjaminw` | **Contraseña**: `benjaminwpass` *(Benjamin Wilson — Analista)*

---

## Requisitos y Puesta en Marcha

```bash
# 1. Instalar dependencias
pnpm install

# 2. Iniciar el servidor unificado Node.js / Express (Puerto 4000)
pnpm dev
# o bien:
node server.js
```

- **Aplicación Web**: `http://localhost:4000`
- **Health Check API**: `http://localhost:4000/api/health`
