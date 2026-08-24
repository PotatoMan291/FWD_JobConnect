# JobConnect — Guía de Diseño

Objetivo: que el panel se sienta como una herramienta de trabajo seria de una empresa de reclutamiento real — sobria, con carácter propio — y **no** como una plantilla de admin genérica (nada de degradado morado-azul con `border-radius: 20px` en todo, ni sidebar oscuro con íconos de FontAwesome por defecto).

---

## 1. Concepto

**Dirección:** "Consultoría de talento" — confiable, editorial, con aire a papelería corporativa de calidad (piénsese en el diseño de un ATS boutique o un despacho de reclutamiento ejecutivo), no en un dashboard de SaaS genérico.

Principios:
- **Fondo claro, cálido y neutro** (no blanco puro, no gris azulado de plantilla).
- **Un solo color de acento**, usado con disciplina (no un color distinto por módulo).
- **Tipografía con personalidad** en los títulos, texto utilitario limpio en las tablas.
- **Bordes finos y sombras casi imperceptibles**, no tarjetas flotantes con sombra pesada.
- **Densidad de información alta pero ordenada** — es una herramienta de trabajo, no un landing page.

---

## 2. Paleta de color

Definida como variables CSS en `assets/styles/tokens.css`.

| Token | Valor | Uso |
|---|---|---|
| `--color-bg` | `#F6F4EF` | Fondo general (hueso cálido, no blanco puro) |
| `--color-surface` | `#FFFFFF` | Tarjetas, tablas, modales |
| `--color-surface-alt` | `#EFEBE2` | Filas alternas, encabezados de tabla |
| `--color-border` | `#DDD6C8` | Bordes finos |
| `--color-ink` | `#1F1B16` | Texto principal (casi negro cálido, no `#000`) |
| `--color-ink-muted` | `#6B6355` | Texto secundario |
| `--color-accent` | `#1F5C4F` | Verde bosque profundo — acento único (botones primarios, enlaces activos, foco) |
| `--color-accent-hover` | `#173F37` | Hover del acento |
| `--color-accent-soft` | `#E4ECE7` | Fondos suaves de badges/estado activo del menú |
| `--color-success` | `#3E7A4A` | Confirmaciones |
| `--color-error` | `#A6332B` | Errores, eliminar |
| `--color-warning` | `#B4791F` | Estados pendientes |

Nada de morado/violeta de plantilla ni azul "SaaS por defecto" (`#4F46E5`, `#6366F1`, etc.). El verde bosque + hueso cálido evocan "empleabilidad / crecimiento profesional" sin caer en cliché corporativo frío.

---

## 3. Tipografía

- **Títulos y branding (`h1`–`h3`, nombre "JobConnect" en el header):** una serif con carácter editorial — ej. `"Fraunces", serif` (variable font, disponible en Google Fonts, con `font-optical-sizing`). Da la seriedad de un despacho profesional, evita el look "startup con Inter en todo".
- **Interfaz, tablas, formularios, menú:** una sans utilitaria muy legible — ej. `"Inter", system-ui, sans-serif` en pesos 400/500/600 solamente (evitar 700+ salvo énfasis puntual).
- **Numérico / IDs / código de vacante:** `"IBM Plex Mono", monospace` para IDs, tarifas, fechas — refuerza la sensación de "datos de sistema" en tablas.

```css
--font-display: "Fraunces", serif;
--font-body: "Inter", system-ui, sans-serif;
--font-mono: "IBM Plex Mono", monospace;

--fs-h1: 2rem;      /* 32px */
--fs-h2: 1.5rem;    /* 24px */
--fs-h3: 1.125rem;  /* 18px */
--fs-body: 0.9375rem; /* 15px */
--fs-small: 0.8125rem; /* 13px */
```

Escala tipográfica moderada: la mayoría de la interfaz vive entre 13–15px (es una herramienta densa de datos), y la serif solo aparece en títulos de página y el nombre del producto.

---

## 4. Espaciado y forma

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;

--radius-sm: 4px;   /* inputs, badges */
--radius-md: 6px;   /* tarjetas, modales */
--radius-lg: 10px;  /* solo contenedores grandes puntuales */
```

- Radios **pequeños y consistentes** (4–10px), nunca `border-radius` de 16–24px en tarjetas grandes: eso es lo primero que delata una plantilla genérica.
- Sombras casi ausentes: `box-shadow: 0 1px 2px rgba(31, 27, 22, 0.06);` para elevar tarjetas/modal, nada de sombras difusas grandes de "glassmorphism".

---

## 5. Layout general

```
┌──────────────┬─────────────────────────────────────────┐
│              │  Header: título de página + acciones      │
│   Sidebar    ├─────────────────────────────────────────┤
│   (menu.js)  │                                           │
│  240px fijo  │  Filtro (filter-layout.js)                 │
│  colapsable  │─────────────────────────────────────────  │
│  en móvil    │  Tabla / listado (table.js)                │
│              │                                           │
│              │  Paginación por cursor (pagination.js)     │
└──────────────┴─────────────────────────────────────────┘
```

- **Sidebar:** fondo `--color-surface`, no oscuro. Item activo con fondo `--color-accent-soft` + texto `--color-accent`, borde izquierdo de 2px sólido en `--color-accent` (en vez del típico "pill" redondeado). Logo/nombre "JobConnect" en `--font-display`.
- **Header de página:** título en `--font-display` `--fs-h2`, subtítulo corto en `--color-ink-muted`, botón de acción primaria alineado a la derecha.
- **Breakpoints:**
  - `≥1024px`: sidebar fija visible.
  - `768–1023px`: sidebar colapsable (ícono hamburguesa), overlay al abrir.
  - `<768px`: tablas con scroll horizontal controlado (o vista de tarjetas apiladas para listados críticos como Candidatos y Vacantes).

---

## 6. Componentes clave

### Botones
- Primario: fondo `--color-accent`, texto blanco hueso (`#F6F4EF`), sin sombra, `radius-sm`, transición de 120ms al hover.
- Secundario: borde 1px `--color-border`, fondo `--color-surface`, texto `--color-ink`.
- Destructivo (eliminar): borde `--color-error`, texto `--color-error`, fondo transparente; solo se rellena en hover.
- **Nunca** botones con degradado.

### Tabla (`table.js`)
- Encabezado con fondo `--color-surface-alt`, texto `--color-ink-muted`, mayúsculas pequeñas (`letter-spacing: 0.03em`), `--fs-small`.
- Filas con borde inferior 1px `--color-border` (no zebra-stripe agresivo; alternancia muy sutil opcional).
- Columnas de estado (ej. "Activo", "Contratado", "Pendiente") como badges con `--radius-sm`, no píldoras completamente redondas.
- Acciones por fila (editar/eliminar) como íconos SVG propios en 16px, color `--color-ink-muted`, se oscurecen al hover — no textos "Editar | Eliminar" repetidos en cada fila.

### Filtro (`filter-layout.js`)
- Barra horizontal sobre la tabla, fondo `--color-surface`, borde inferior con la tabla formando un solo bloque visual.
- Input de búsqueda con ícono de lupa a la izquierda, sin borde redondeado exagerado.
- Selects de filtro con estilo nativo minimizado (flecha propia vía SVG de fondo, no el default del navegador).

### Paginación (`pagination.js`)
- Texto "Mostrando X–Y de Z" a la izquierda (`--color-ink-muted`, `--fs-small`).
- Botones "Anterior / Siguiente" a la derecha, estilo botón secundario, deshabilitados con `opacity: 0.4` en los extremos del cursor.

### Modal (`modal.js`)
- Fondo overlay `rgba(31,27,22,0.4)` (tono cálido, no negro puro).
- Panel `--color-surface`, `--radius-md`, sombra sutil, ancho máximo 480–560px según el formulario.
- Título en `--font-display`.

### Toast (`toast.js`)
- Aparece esquina inferior derecha, franja izquierda de color de 3px según tipo (`--color-success` / `--color-error`), fondo `--color-surface`, sin íconos genéricos de librería (SVG propio: check / x).

### Login
- Pantalla dividida: panel izquierdo con el nombre "JobConnect" en `--font-display` grande sobre `--color-accent` (texto claro), panel derecho con el formulario sobre `--color-bg`. Evita el clásico "card centrada con logo arriba" que se repite en todas las plantillas.

---

## 7. Estados vacíos y de carga

- **Cargando:** skeleton simple (bloques `--color-surface-alt` con animación de opacidad suave), no spinners genéricos girando.
- **Sin resultados tras filtrar:** ilustración lineal simple propia (SVG monocromo en `--color-ink-muted`) + texto breve + botón "Limpiar filtros".
- **Error de red:** mensaje en el propio contenedor de la tabla (no solo un toast), con botón "Reintentar" — coherente con RNF-05 (no romper la app ante fallos).

---

## 8. Temas: Claro, Oscuro, Sepia y Contraste

Los 4 temas se definen como bloques de variables sobre el mismo `tokens.css`, activados con `[data-theme="..."]` en `<html>`. Ningún componente cambia su CSS por tema: todos consumen las mismas variables (`--color-bg`, `--color-accent`, etc.), solo cambia su valor.

### `light` (por defecto — ver sección 2)
Hueso cálido + verde bosque. Para uso diurno estándar.

### `dark`
No es "invertir el claro": se recalibra para que el acento y los estados sigan legibles sobre fondo oscuro.

| Token | Valor |
|---|---|
| `--color-bg` | `#181613` |
| `--color-surface` | `#211E19` |
| `--color-surface-alt` | `#2A2620` |
| `--color-border` | `#3A352C` |
| `--color-ink` | `#F1EDE4` |
| `--color-ink-muted` | `#A69D8A` |
| `--color-accent` | `#5FAE94` |
| `--color-accent-hover` | `#78C2A9` |
| `--color-accent-soft` | `#243830` |
| `--color-success` | `#6FBF7B` |
| `--color-error` | `#E2857B` |
| `--color-warning` | `#E0AE5C` |

### `sepia` — "papel envejecido"
Pensado para sesiones largas de revisión de candidatos/entrevistas; reduce fatiga visual sin ir a negro puro.

| Token | Valor |
|---|---|
| `--color-bg` | `#F1E7D2` |
| `--color-surface` | `#FAF3E4` |
| `--color-surface-alt` | `#E9DCC0` |
| `--color-border` | `#D2C09B` |
| `--color-ink` | `#3A2E1F` |
| `--color-ink-muted` | `#7A6A4E` |
| `--color-accent` | `#8C4A2B` |
| `--color-accent-hover` | `#6E3A20` |
| `--color-accent-soft` | `#EAD9C4` |
| `--color-success` | `#5C7A3E` |
| `--color-error` | `#9C3B2C` |
| `--color-warning` | `#A8792A` |

### `contrast` — "alto contraste / navy + dorado"
Para accesibilidad y legibilidad en pantallas con reflejo o usuarios con baja visión: contraste AAA entre texto y fondo, un único acento muy saturado.

| Token | Valor |
|---|---|
| `--color-bg` | `#0B1220` |
| `--color-surface` | `#0F1830` |
| `--color-surface-alt` | `#152140` |
| `--color-border` | `#2C3B5E` |
| `--color-ink` | `#FFFFFF` |
| `--color-ink-muted` | `#C7D0E5` |
| `--color-accent` | `#E8B640` |
| `--color-accent-hover` | `#F5CB6B` |
| `--color-accent-soft` | `#2E2A15` |
| `--color-success` | `#5FE07E` |
| `--color-error` | `#FF6B5E` |
| `--color-warning` | `#E8B640` |

### Selector de tema e idioma
Ambos controles (`theme-switcher.js`, `language-switcher.js`) viven juntos en el extremo derecho del header, como iconos pequeños de 32×32px con `--radius-sm`, separados por un divisor vertical fino de `--color-border`:

```
[ Tema ▾ ]  |  [ ES ▾ ]
```

- El selector de tema despliega 4 puntos de color (uno por tema) con su nombre al lado, no un dropdown de texto plano.
- El selector de idioma es un toggle simple `ES / EN`, sin banderas (evita el cliché visual de íconos de bandera para idioma).
- El cambio de tema tiene una transición de color de 150ms en `background` y `color` a nivel global, para que el cambio no sea un "salto" brusco.

---

## 9. Qué evitar explícitamente

- Gradientes morado→azul o cualquier gradiente decorativo sin función.
- Iconografía de librerías genéricas sin curar (usar un set propio, coherente en grosor de trazo).
- Cards con sombra pesada tipo "material design" antiguo.
- Todo en `border-radius` grande (look "app de delivery").
- Tipografía única Inter/Roboto para todo, sin jerarquía entre display y body.
- Paleta de "dashboard SaaS" (azul/índigo + gris frío) — se reemplaza por hueso cálido + verde bosque.