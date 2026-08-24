# JobConnect — Plan de Construcción del Proyecto

Panel de administración frontend para una empresa de empleabilidad, consumiendo la API pública [DummyJSON](https://dummyjson.com) mediante `fetch`.

---

## 1. Stack tecnológico

| Categoría | Tecnología | Motivo |
|---|---|---|
| Gestor de paquetes | **pnpm** | Instalación rápida, `node_modules` eficiente por symlinks |
| Runtime / tooling | **Node.js** (LTS) | Necesario para correr pnpm y el servidor de desarrollo |
| Servidor de desarrollo | **Vite** (`vite` sin plugins de framework) | Sirve HTML/CSS/JS vanilla con recarga en caliente, sin imponer ningún framework |
| Lenguaje | **HTML5 + CSS3 + JavaScript vanilla (ES Modules)** | Requisito explícito del proyecto: sin frameworks |
| Peticiones HTTP | `fetch` nativo + `async/await` | Requisito RNF-03 |
| Persistencia de sesión | `localStorage` | Requisito RF-02 |
| Control de versiones | **Git** + repositorio remoto (GitHub/GitLab) | Requisito RNF-06 |
| Internacionalización | Diccionarios JSON propios (`es`/`en`) + `utils/i18n.js` | Sin librerías externas de i18n, mismo criterio "vanilla" del proyecto |
| Temas visuales | Variables CSS + atributo `data-theme` en `<html>` | Permite Claro, Oscuro y 2 temas adicionales sin duplicar CSS |

> Vite se usa **únicamente como servidor de desarrollo y empaquetador**, no como framework. No se usará JSX, ni Vue, ni React. Todo el código sigue siendo HTML/CSS/JS plano organizado en módulos ES (`import`/`export`).

---

## 2. Estructura de carpetas

```
jobconnect/
├── index.html                  # Redirige a login o dashboard según sesión
├── package.json
├── pnpm-lock.yaml
├── vite.config.js
├── .gitignore
├── .env.example                 # BASE_URL de la API (no credenciales reales)
├── README.md
│
├── public/
│   └── favicon.svg
│
└── src/
    ├── main.js                  # Punto de entrada, bootstrap de la app
    │
    ├── assets/
    │   ├── styles/
    │   │   ├── tokens.css        # Variables de diseño (color, tipografía, espaciado)
    │   │   ├── base.css          # Reset + estilos base
    │   │   ├── components.css    # Botones, inputs, tablas, badges, modales
    │   │   └── layout.css        # Grid general, sidebar, header
    │   └── icons/                # SVGs propios (sin librerías genéricas de iconos)
    │
    ├── pages/
    │   ├── login/
    │   │   ├── login.html
    │   │   └── login.js
    │   ├── dashboard/
    │   │   ├── dashboard.html
    │   │   └── dashboard.js
    │   ├── candidatos/            # /users
    │   ├── vacantes/              # /products
    │   ├── empresas/              # /carts
    │   ├── postulaciones/         # /posts
    │   ├── entrevistas/           # /comments
    │   └── tareas/                # /todos
    │       (cada carpeta: <modulo>.html, <modulo>.js, <modulo>-form.js)
    │
    ├── components/
    │   ├── menu.js                # Menú/sidebar modular, sensible al rol (ver sección 4)
    │   ├── filter-layout.js        # Filtro + búsqueda reutilizable para listas (ver sección 5)
    │   ├── pagination.js           # Controles de paginación por cursor (ver sección 6)
    │   ├── toast.js                # Mensajes de éxito/error (RF-09)
    │   ├── modal.js                # Modal genérico para formularios y confirmaciones
    │   ├── table.js                # Renderizado genérico de tablas a partir de columnas + datos
    │   ├── language-switcher.js    # Selector de idioma (ver sección 12)
    │   └── theme-switcher.js       # Selector de tema Claro/Oscuro/Sepia/Contraste (ver sección 13)
    │
    ├── i18n/
    │   ├── es.json                 # Diccionario español (idioma por defecto)
    │   └── en.json                 # Diccionario inglés
    │
    ├── services/
    │   ├── http-client.js          # Wrapper de fetch: headers, Authorization, manejo de errores
    │   ├── auth-service.js         # login, logout, getToken, isAuthenticated
    │   ├── candidatos-service.js   # CRUD /users
    │   ├── vacantes-service.js     # CRUD /products
    │   ├── empresas-service.js     # CRUD /carts
    │   ├── postulaciones-service.js# CRUD /posts
    │   ├── entrevistas-service.js  # CRUD /comments
    │   └── tareas-service.js       # CRUD /todos
    │
    ├── guards/
    │   └── auth-guard.js           # Redirige a login si no hay token válido (RF-03)
    │
    └── utils/
        ├── query-params.js         # Construcción de query strings (limit, skip, filtros)
        ├── format.js                # Formateo de fechas, textos, truncados
        ├── storage.js               # Wrapper de localStorage (evita acceso directo disperso)
        ├── i18n.js                  # Carga de diccionario activo + función t(key)
        └── theme.js                 # Aplica/lee el tema activo (data-theme en <html>)
```

---

## 3. Autenticación (RF-01 a RF-04)

**`services/auth-service.js`**
- `login(username, password)` → `POST /auth/login`, guarda `{ token, refreshToken, user }` mediante `utils/storage.js`.
- `logout()` → limpia `localStorage`.
- `isAuthenticated()` → true si existe un token no vacío.
- `getToken()` → usado por `http-client.js` para inyectar el header `Authorization: Bearer <token>`.

**`guards/auth-guard.js`**
- Se ejecuta al inicio de cada página de módulo.
- Si `isAuthenticated()` es falso → `window.location.href = '/pages/login/login.html'`.
- Se importa como primera línea en cada `*.js` de página protegida, así ninguna pantalla queda desprotegida por olvido.

**`services/http-client.js`**
- Centraliza `fetch`: agrega headers, agrega token si existe, parsea JSON, normaliza errores.
- Todas las llamadas HTTP del proyecto pasan por aquí (ningún servicio llama `fetch` directamente) → un solo lugar para manejar `try/catch` y errores de red (RNF-05).

---

## 4. Menú modular y sensible al rol (RNF-02)

**`components/menu.js`** exporta una función `renderMenu(container, currentUser)`:

- Define un arreglo de items `{ label, path, roles: ['recruiter', 'admin'] }`.
- Filtra los items según el rol del usuario autenticado (el campo `role` que devuelve DummyJSON en `/auth/login`, o un rol simulado si se desea extender el ejercicio).
- Marca como activo el item correspondiente a la página actual.
- Se importa e invoca **una sola vez** desde cada página (`dashboard.js`, `candidatos.js`, etc.), evitando reescribir el `<nav>` en cada HTML.
- El `<header>`/`<aside>` en cada `*.html` solo tiene un contenedor vacío, ej. `<aside id="menu"></aside>`, que `menu.js` rellena dinámicamente.

Esto asegura que si mañana cambian las opciones de menú por rol, se edita **un solo archivo**.

---

## 5. `filter-layout.js` — filtro reutilizable para listas

Cada uno de los 6 módulos lista registros y necesita búsqueda/filtro. En vez de repetir esa lógica:

**`components/filter-layout.js`** expone algo como:

```js
export function createFilterLayout({ container, fields, onFilterChange }) {
  // Renderiza inputs de búsqueda/select según `fields`
  // (ej: [{ key: 'search', type: 'text', placeholder: 'Buscar candidato...' },
  //       { key: 'status', type: 'select', options: [...] }])
  // Debounce en inputs de texto.
  // Llama a onFilterChange(filtersObject) cada vez que el usuario cambia un filtro.
}
```

- Cada página de listado (`candidatos.js`, `vacantes.js`, etc.) solo define **qué campos** filtrar y **qué hacer** con el resultado (normalmente: reconstruir query params y volver a pedir la primera página).
- La lógica de debounce, limpieza de filtros y estado de "sin resultados" vive en un solo lugar.

---

## 6. Paginación por cursor (`components/pagination.js`)

DummyJSON pagina con `limit` y `skip`, pero el requerimiento pide **cursor pagination** en la UI/lógica del cliente. Se implementa un cursor lógico sobre ese esquema:

- El cursor es el `skip` acumulado; cada respuesta trae `total`, y se calcula `nextCursor = skip + limit` (si `nextCursor < total`) y `prevCursor = max(0, skip - limit)`.
- **`utils/query-params.js`** arma la URL: `?limit=10&skip=<cursor>` + los filtros activos de `filter-layout.js`.
- **`components/pagination.js`** expone `renderPagination({ container, cursor, limit, total, onCursorChange })`:
  - Botones "Anterior" / "Siguiente" (deshabilitados en los extremos).
  - No usa números de página fijos (evita asumir tamaños de página constantes), tratando el `skip` como un cursor opaco que el componente pasa hacia adelante/atrás.
- Cada servicio (`candidatos-service.js`, etc.) recibe `{ cursor, limit, filters }` y arma la petición con `query-params.js`, devolviendo `{ data, nextCursor, prevCursor, total }` de forma uniforme para que `pagination.js` y `filter-layout.js` funcionen igual en los 6 módulos.

---

## 7. CRUD por módulo (RF-05 a RF-08)

Cada `*-service.js` implementa las mismas 5 funciones con la firma uniforme, variando solo el recurso y los verbos que DummyJSON soporta para él:

```js
getAll({ cursor, limit, filters })
getById(id)
create(payload)          // POST
update(id, payload)      // PUT (reemplazo total, solo en users/products/carts)
patch(id, payload)       // PATCH
remove(id)                // DELETE
```

| Módulo | PUT disponible | PATCH disponible |
|---|---|---|
| Candidatos (`/users`) | ✅ | ✅ |
| Vacantes (`/products`) | ✅ | ✅ |
| Empresas (`/carts`) | ✅ | — |
| Postulaciones (`/posts`) | — | ✅ |
| Entrevistas (`/comments`) | — | ✅ |
| Tareas (`/todos`) | — | ✅ |

Las páginas de edición usan `update()` o `patch()` según lo que el módulo soporte, tal como indica la tabla del enunciado.

---

## 8. Feedback y manejo de errores (RF-09, RNF-05)

- `components/toast.js`: `showToast(message, type = 'success' | 'error')`.
- `http-client.js` captura errores de red/HTTP y los propaga como un objeto `{ ok: false, message }`, que cada página traduce en un `toast` sin que la app se rompa.

---

## 9. Flujo de trabajo Git (RNF-06)

- Rama `main` protegida; desarrollo en `develop`.
- Una rama por módulo/feature: `feature/candidatos-crud`, `feature/menu-roles`, `feature/filter-layout`, etc.
- Commits descriptivos y frecuentes de **todos** los integrantes (convención sugerida: `feat:`, `fix:`, `docs:`, `refactor:`).
- Pull requests hacia `develop` antes de cada sesión de cierre, para revisión cruzada del equipo.

---

## 10. Traducciones / internacionalización (i18n)

El sistema soporta **español (por defecto) e inglés**, sin librerías externas, siguiendo el mismo criterio "vanilla" del resto del proyecto.

**`i18n/es.json` / `i18n/en.json`** — diccionarios planos por clave, agrupados por página/módulo:

```json
{
  "menu.candidatos": "Candidatos",
  "menu.vacantes": "Vacantes",
  "login.title": "Iniciar sesión",
  "login.username": "Usuario",
  "table.actions": "Acciones",
  "pagination.showing": "Mostrando {from}–{to} de {total}",
  "toast.saveSuccess": "Registro guardado correctamente",
  "toast.saveError": "No se pudo guardar el registro"
}
```

**`utils/i18n.js`** expone:

```js
initI18n()                  // Lee idioma guardado en localStorage (o 'es' por defecto), carga el JSON correspondiente
t(key, params = {})         // Devuelve el texto traducido; reemplaza {placeholders} si se pasan params
setLanguage(lang)           // Cambia idioma activo, guarda en localStorage, dispara un evento 'languagechange'
getLanguage()
```

- Todas las páginas usan `t('clave')` en vez de texto fijo (labels, botones, encabezados de tabla, mensajes de `toast.js`).
- Al cambiar de idioma no se recarga la página: cada componente (`menu.js`, `table.js`, `filter-layout.js`, `pagination.js`, `toast.js`) se suscribe al evento `languagechange` y vuelve a pintar sus textos.
- **`components/language-switcher.js`** renderiza un selector compacto (ES / EN) en el header, junto al `theme-switcher.js`.

---

## 11. Temas visuales (Claro, Oscuro y 2 adicionales)

Se implementan **4 temas** mediante variables CSS y un atributo `data-theme` en `<html>`, sin duplicar hojas de estilo ni lógica de componentes (los componentes solo usan `var(--color-*)`, nunca colores fijos):

| Tema | Valor `data-theme` | Concepto |
|---|---|---|
| Claro | `light` (por defecto) | Paleta hueso cálido + verde bosque, definida en `02-DISEÑO.md` |
| Oscuro | `dark` | Inversión tonal cuidada, no solo "invertir colores" |
| Sepia | `sepia` | Tono papel envejecido, para sesiones largas de lectura de datos |
| Contraste | `contrast` | Alto contraste (navy + dorado), pensado para accesibilidad/legibilidad |

Detalle de paletas de cada tema en `02-DISEÑO.md`, sección 9.

**`utils/theme.js`** expone:

```js
initTheme()          // Lee tema guardado en localStorage (o 'light' por defecto) y lo aplica a <html data-theme="...">
setTheme(themeName)  // Aplica el tema, lo persiste en localStorage
getTheme()
```

**`components/theme-switcher.js`** renderiza un control en el header (ej. 4 puntos de color o un `<select>`) para alternar entre los 4 temas sin recargar la página; solo cambia el atributo `data-theme`, por lo que el cambio es instantáneo y no requiere lógica adicional en cada componente.

---

## 12. Puesta en marcha

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd jobconnect

# 2. Instalar dependencias
pnpm install

# 3. Levantar el servidor de desarrollo
pnpm dev

# 4. Compilar para producción (opcional, si se requiere entregar build)
pnpm build
pnpm preview
```

`package.json` (referencia mínima):

```json
{
  "name": "jobconnect",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^5.4.0"
  }
}
```

---

## 13. Checklist de trazabilidad con el enunciado

- [x] RF-01 a RF-04 → `auth-service.js`, `auth-guard.js`, `http-client.js`
- [x] RF-05 a RF-08 → `*-service.js` por módulo + `table.js` + formularios en `pages/*`
- [x] RF-09 → `toast.js`
- [x] RF-10 → `menu.js`
- [x] RNF-01 a RNF-03 → stack vanilla + `pnpm`/Vite + `fetch`/`async-await` centralizado
- [x] RNF-04 → ver `02-DISEÑO.md` (responsive, breakpoints)
- [x] RNF-05 → `http-client.js` con `try/catch`
- [x] RNF-06 → sección 9
- [x] RNF-07 → nombres de módulos y funciones consistentes en toda la estructura
- [x] RNF-08 → `.env.example` para `BASE_URL`, sin credenciales hardcodeadas más allá de las de prueba en README
- [x] RNF-09 → `README.md` en la raíz
- [x] Extra: Traducciones ES/EN → `i18n/`, `utils/i18n.js`, `components/language-switcher.js`
- [x] Extra: Temas Claro/Oscuro/Sepia/Contraste → `utils/theme.js`, `components/theme-switcher.js`, `data-theme` en `tokens.css`