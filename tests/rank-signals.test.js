import test from 'node:test';
import assert from 'node:assert/strict';
import { rankSignals, relativeTime } from '../src/rank-signals.js';

test('rankSignals assigns deterministic UI ranking metadata', () => {
  const ranked = rankSignals([
    { id: 'watch', status: 'watch' },
    { id: 'alert', status: 'alert' }
  ]);

  assert.deepEqual(ranked.map(({ id, score, confidence }) => ({ id, score, confidence })), [
    { id: 'alert', score: 92, confidence: 'Alta' },
    { id: 'watch', score: 58, confidence: 'En seguimiento' }
  ]);
});

test('relativeTime uses readable Spanish labels', () => {
  assert.equal(relativeTime('2026-06-10', '2026-06-11T15:00:00Z'), 'Hace 1 día');
  assert.equal(relativeTime('2026-06-11', '2026-06-11T15:00:00Z'), 'Hoy');
});
