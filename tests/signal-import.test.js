import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHandler } from '../api/signals/import.js';
import { importSnapshot } from '../src/server/import-signals.js';
import { normalizeSnapshot, validateSnapshot } from '../src/signal-import.js';

const fixturePath = new URL('../fixtures/daily/2026-06-11-ai-news.json', import.meta.url);
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));

function memoryRepository() {
  const urls = new Set();
  const runs = [];
  return {
    urls,
    runs,
    async existingSourceUrls(values) { return new Set(values.filter((value) => urls.has(value))); },
    async insertSignals(signals) { signals.forEach((signal) => urls.add(signal.source_url)); return signals.map((_, index) => ({ id: String(index) })); },
    async recordRun(run) { runs.push(run); }
  };
}

function responseRecorder() {
  return { code: null, body: null, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}

test('validates and normalizes a compatible snapshot', () => {
  assert.equal(validateSnapshot(fixture).valid, true);
  const normalized = normalizeSnapshot(fixture, '2026-06-11-ai-news.json');
  assert.equal(normalized.searchDate, '2026-06-11');
  assert.equal(normalized.signals[0].source_type, null);
  assert.equal(normalized.signals.length, fixture.signals.length);
});

test('accepts every existing daily snapshot', async () => {
  for (const date of ['2026-06-11', '2026-06-18', '2026-07-01']) {
    const snapshot = JSON.parse(await readFile(new URL(`../fixtures/daily/${date}-ai-news.json`, import.meta.url), 'utf8'));
    assert.equal(validateSnapshot(snapshot).valid, true, date);
  }
});

test('rejects an incomplete signal', () => {
  const invalid = structuredClone(fixture);
  delete invalid.signals[0].source.url;
  const validation = validateSnapshot(invalid);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join('\n'), /source.url/);
});

test('preserves an optional editorial source type', () => {
  const typed = structuredClone(fixture);
  typed.signals[0].source.type = 'fuente_oficial';
  assert.equal(validateSnapshot(typed).valid, true);
  assert.equal(normalizeSnapshot(typed).signals[0].source_type, 'fuente_oficial');
});

test('imports idempotently by source URL and audits each run', async () => {
  const repository = memoryRepository();
  const first = await importSnapshot(fixture, { repository, snapshotName: 'fixture.json' });
  const second = await importSnapshot(fixture, { repository, snapshotName: 'fixture.json' });
  assert.equal(first.body.created, fixture.signals.length);
  assert.equal(first.body.skipped, 0);
  assert.equal(second.body.created, 0);
  assert.equal(second.body.skipped, fixture.signals.length);
  assert.equal(repository.runs.length, 2);
});

test('requires the ingestion bearer secret', async () => {
  const handler = createHandler({ environment: { AIRADAR_INGEST_SECRET: 'test-secret' }, repositoryFactory: memoryRepository });
  const denied = responseRecorder();
  await handler({ method: 'POST', headers: {}, body: fixture }, denied);
  assert.equal(denied.code, 401);
  const allowed = responseRecorder();
  await handler({ method: 'POST', headers: { authorization: 'Bearer test-secret' }, body: fixture }, allowed);
  assert.equal(allowed.code, 200);
  assert.equal(allowed.body.created, fixture.signals.length);
});
