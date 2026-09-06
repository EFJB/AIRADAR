# AI Radar

AI Radar es el proyecto del curso avanzado de Codex.

El objetivo del producto es organizar noticias, herramientas, papers, repos y lanzamientos de IA para convertirlos en senales accionables para builders: que paso, por que importa, que tan confiable es y que vale la pena probar.

Estado inicial: definicion de producto, stack objetivo y reglas iniciales. La implementacion se construye por capas durante el curso con Codex.

## Problema

El ritmo de la inteligencia artificial genera demasiado ruido:

- lanzamientos repetidos en varias fuentes,
- repos que parecen importantes pero no tienen adopcion,
- demos sin documentacion suficiente,
- papers sin ejemplo practico,
- herramientas con impacto real mezcladas con marketing.

AI Radar debe ayudar a separar ruido de senales utiles.

## Producto Objetivo

Al final del curso, AI Radar debe poder:

- recopilar novedades de IA desde fuentes seleccionadas,
- normalizar noticias, repos, papers y productos,
- detectar duplicados y noticias parecidas,
- agrupar senales por tema,
- rankear por novedad, impacto, evidencia y accionabilidad,
- generar guias practicas para decidir que probar,
- exponer resultados en un dashboard,
- guardar trazas de decisiones y validaciones,
- desplegarse con infraestructura controlada.

## Estado Inicial

El starter contiene:

- `README.md`
- `.gitignore`

La primera clase usa este estado para mostrar como `AGENTS.md` cambia la forma en que Codex entiende un proyecto antes de escribir codigo.

## Stack Objetivo

El stack debe mantenerse simple para que el foco del curso sea Codex, no el framework.

- Frontend: HTML, CSS y JavaScript.
- Dominio: modulos JavaScript reutilizables.
- CLI: `airadar` para comandos internos del proyecto.
- Automatizacion local: scripts Node.js.
- Proyecto agent-friendly: Dekk cuando existan comandos que deban usar humanos y agentes.
- API: Vercel Functions cuando hagan falta endpoints.
- Datos locales: fixtures y snapshots antes de conectar servicios externos.
- Base de datos: Supabase cuando el contrato local ya funcione.
- QA: `node:test` para dominio y Playwright cuando exista interfaz visual.
- Demo final: video programatico con la evidencia del proyecto.

## Reglas Iniciales Para Codex

Antes de implementar, Codex debe distinguir:

- vision del producto,
- estado actual del repositorio,
- decisiones tecnicas tomadas,
- decisiones pendientes,
- limites de seguridad.

Codex no debe inventar archivos, comandos, servicios ni integraciones como si ya existieran.

## Automatizacion Local

Comandos disponibles:

- `python scripts/query-ai-radar-signals.py --date 2026-06-11 --count 3 --order newest` - lee un snapshot diario de `fixtures/daily/` y devuelve senales AI Radar en JSON.
- `npm run dev` - sirve el dashboard local en `http://localhost:4173`, que consume el fixture declarado `fixtures/daily/2026-06-11-ai-news.json`.
- `npm test` - ejecuta las pruebas de módulos de dominio y la lógica de ranking de la interfaz.

## Persistencia de señales (desarrollo)

Las fuentes editoriales siguen en Notion y en `config/sources.json` (cuando exista). Supabase solo guarda señales ya normalizadas y el historial de sus importaciones.

`POST /api/signals/import` es una Vercel Function interna. Requiere `Authorization: Bearer <AIRADAR_INGEST_SECRET>` y un JSON compatible con `fixtures/contracts/ai-radar-daily-search.schema.json`. La respuesta incluye `created`, `skipped` y `errors`; la idempotencia se basa en `source_url`.

1. Copia `.env.example` a `.env` y completa las tres variables únicamente en un entorno server-side.
2. Aplica `supabase/migrations/20260722000000_create_ai_radar_persistence.sql` al proyecto de desarrollo `smoknoyjjooksfsovlno`.
3. Configura las mismas variables en Vercel para desarrollo. Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` ni `AIRADAR_INGEST_SECRET` al navegador.
4. Ejecuta `npm install` y `npm test` con Node.js 20 o superior.

La migración activa RLS en `signals` e `ingestion_runs` y no concede políticas públicas. La clave `service_role` se usa solo dentro de la Function.

Para importar un snapshot desde una automatización confiable:

```sh
curl -X POST "$AIRADAR_IMPORT_URL/api/signals/import" \
  -H "Authorization: Bearer $AIRADAR_INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -H "X-AI-Radar-Snapshot: 2026-06-11-ai-news.json" \
  --data-binary @fixtures/daily/2026-06-11-ai-news.json
```

Los tres snapshots de `fixtures/daily/` están listos para la carga inicial. No se han importado automáticamente: crear el esquema, definir secretos e insertar datos requieren la aprobación indicada en el plan.
