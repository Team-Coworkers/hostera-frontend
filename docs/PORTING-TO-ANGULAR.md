# Port de Hostera a Angular + TypeScript — curso 1ASI0729

Este repositorio es el material de **Aplicaciones Web (1ASI0730)** tal como se entregó,
importado para que el equipo de **Open Source (1ASI0729)** lo tome como base. El producto
es el mismo; cambian el framework, el lenguaje y los integrantes.

## Qué hay aquí

| Repositorio | Contenido |
| --- | --- |
| `hostera-frontend-wa` | Frontend Vue 3 + json-server (este repo) |
| `hostera-landing-page-wa` | Landing page en HTML/CSS/JS |
| `hostera-project-report-wa` | Informe del proyecto en Markdown |

Los tres son **snapshots sin historial**: cada uno arranca con un commit único. El historial
original vive en la organización del curso de Aplicaciones Web.

## Lo que NO hay que rehacer

La aplicación ya está organizada por **bounded contexts con capas DDD**, y esa estructura
se traslada a Angular sin cambios:

```
src/<contexto>/
├── domain/model/      # entidades y reglas de negocio
├── application/       # casos de uso y estado (stores)
├── infrastructure/    # llamadas HTTP, assemblers
└── presentation/
    ├── components/
    └── views/
```

Contextos existentes: `access-control`, `bookings`, `inventory`, `overview`, `rooms` y
`shared`. Manténganlos con los mismos nombres: el informe, los diagramas C4 y el
EventStorming se apoyan en ellos, y renombrarlos obliga a rehacer esos artefactos.

Las carpetas `domain/model` son las que menos cambian. Son clases de negocio sin
dependencias del framework: al pasarlas a TypeScript solo se les añaden los tipos.

## Equivalencias Vue → Angular

| Vue 3 (actual) | Angular + TypeScript |
| --- | --- |
| Componente `.vue` (SFC) | Componente standalone: `.ts` + `.html` + `.css` |
| Pinia (`application/*.store.js`) | Servicio `@Injectable` con signals |
| PrimeVue | PrimeNG (misma familia, API distinta) |
| `vue-router` (`router.js`) | `@angular/router` con rutas por contexto |
| `vue-i18n` (`i18n.js`, `locales/en`, `locales/es`) | `@ngx-translate/core` conservando los mismos JSON |
| `axios` (`infrastructure/*.api.js`) | `HttpClient` de `@angular/common/http` |
| `chart.js` | `chart.js` igual, o PrimeNG Chart |
| `v-if` / `v-for` | `@if` / `@for` (control flow de Angular 17+) |
| `props` / `emits` | `input()` / `output()` |
| `ref` / `computed` | `signal()` / `computed()` |

El backend de desarrollo **no se toca**: `server/` es json-server y sigue funcionando igual
(`npm run server:build` y `npm run server:start`). Solo cambia el cliente HTTP que lo consume.

Los JSON de `src/locales/en` y `src/locales/es` se reutilizan tal cual. No vuelvan a
traducir nada.

## Lo que sí hay que cambiar

1. **Los integrantes.** Este material lleva el equipo de Aplicaciones Web. Hay que
   reemplazarlo por el equipo de Open Source en: la portada del informe, la sección 1.1.2
   (perfiles con foto, código y carrera), el Student Outcome, el Registro de Versiones, la
   matriz de liderazgo y colaboración, el Sprint Backlog, `.git-allowed-users` y la sección
   de equipo de la landing page. Las fotos viven en `assets/chapter-1/` del informe y en
   `public/` de la landing.

2. **Las secciones que faltan** según el enunciado de 1ASI0729 y lo pendiente de la entrega.

3. **Las capturas de evidencia** de GitHub, que corresponden a la otra organización.

4. **Las URLs** que apuntan a la organización de Aplicaciones Web.

## Cómo trabajar

GitFlow, igual que en el otro curso:

```
feature/*  →  develop  →  release/X.Y.Z  →  main (+ tag SemVer)
```

Las ramas de feature salen de `develop` y vuelven a `develop`. Nada de commits directos a
`main` ni a `develop`. Mensajes con Conventional Commits (`feat`, `fix`, `docs`, `chore`).
Usen `--no-ff` en los merges para que el grafo muestre la estructura de ramas: esa
estructura es parte de lo que evalúa la rúbrica.

**Cada integrante commitea desde su propia cuenta.** Antes de empezar, dentro del repo:

```bash
git config user.name "<su-usuario-de-github>"
git config user.email "<su-correo-de-github>"
```

Sin `--global`, para que solo aplique a este repositorio.

## Reparto sugerido

Un contexto por persona mantiene el trabajo parejo y evita conflictos, porque cada quien
toca carpetas distintas:

| Rama | Alcance |
| --- | --- |
| `feature/setup-angular` | Proyecto Angular, routing base, i18n, PrimeNG, HttpClient |
| `feature/context-rooms` | Port del contexto `rooms` |
| `feature/context-bookings` | Port del contexto `bookings` |
| `feature/context-inventory` | Port del contexto `inventory` |
| `feature/context-access-control` | Port del contexto `access-control` |
| `feature/context-overview` | Port del contexto `overview` y los gráficos |

`feature/setup-angular` va primero y se integra a `develop` antes de que arranquen los
demás, porque todos dependen de esa base.
