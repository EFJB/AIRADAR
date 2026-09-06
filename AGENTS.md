# Repository Guidelines

## Estructura del Proyecto y Organización de Módulos

Este repositorio es actualmente un starter para **AI Radar** y solo contiene `README.md` y `.gitignore`. No asumas que existen archivos de código, pruebas, API o build hasta que sean agregados.

Cuando comience la implementación, mantén una estructura simple y explícita:

- `src/` para módulos JavaScript reutilizables del dominio.
- `public/` para HTML, CSS, JavaScript y assets estáticos.
- `scripts/` para automatización local con Node.js.
- `tests/` para pruebas unitarias con `node:test` y fixtures.
- `api/` para Vercel Functions solo cuando hagan falta endpoints.
- `fixtures/` y `snapshots/` para contratos de datos locales antes de usar servicios externos.

## Comandos de Build, Pruebas y Desarrollo

Todavía no hay package manager ni comandos definidos. Antes de agregar comandos, crea los archivos necesarios, como `package.json`, y documenta cada comando en `README.md`.

Comandos esperados a futuro:

- `npm test` — ejecuta pruebas de dominio con `node:test`.
- `npm run dev` — levanta el dashboard local cuando exista UI.
- `node scripts/<tarea>.js` — ejecuta tareas locales de automatización.

No inventes comandos en documentación o automatización antes de que funcionen localmente.

## Estilo de Código y Convenciones de Nombres

Usa JavaScript, HTML y CSS planos salvo que el proyecto adopte explícitamente otra herramienta. Prefiere módulos pequeños, con límites claros y dependencias mínimas.

- Usa indentación de 2 espacios.
- Usa `camelCase` para variables y funciones.
- Usa `PascalCase` solo para clases u objetos tipo constructor.
- Usa kebab-case en minúsculas para nombres de archivo, por ejemplo `signal-ranker.js`.
- Mantén la lógica de dominio separada de la UI y de servicios externos.

## Guías de Pruebas

Usa `node:test` para lógica de dominio cuando existan módulos JavaScript. Ubica las pruebas en `tests/` o junto a los módulos con el patrón `*.test.js`, pero mantén una sola convención.

Prioriza pruebas para normalización, detección de duplicados, ranking y parsing de fuentes. Usa fixtures en lugar de APIs externas en vivo. Agrega Playwright solo cuando exista un dashboard visual.

## Guías de Commits y Pull Requests

Esta copia no incluye historial Git, así que no se puede inferir una convención propia del repositorio. Usa mensajes claros e imperativos, como `Add signal ranking module` o `Document fixture format`.

Cada pull request debe incluir:

- Una descripción breve del cambio.
- Por qué el cambio importa para AI Radar.
- Notas de pruebas o verificación manual.
- Screenshots solo cuando haya cambios de UI.

## Instrucciones Específicas para Agentes

Antes de escribir código, distingue la visión del producto del estado actual del repositorio. El roadmap menciona dashboard, CLI, Vercel, Supabase y Playwright, pero nada de eso está implementado todavía. Agrega integraciones de forma incremental y solo después de definir contratos locales.
