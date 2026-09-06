const signalStatuses = new Set(['new', 'active', 'watch', 'pilot', 'alert']);
const signalIdPattern = /^signal-\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function isDateTime(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function rejectExtraKeys(value, allowed, path, errors) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`${path}.${key} is not allowed`);
  }
}

export function validateSnapshot(snapshot) {
  const errors = [];
  if (!isPlainObject(snapshot)) return { valid: false, errors: ['snapshot must be an object'] };
  rejectExtraKeys(snapshot, new Set(['contract', 'generatedAt', 'query', 'signals']), 'snapshot', errors);
  if (isPlainObject(snapshot.contract)) rejectExtraKeys(snapshot.contract, new Set(['name', 'version']), 'snapshot.contract', errors);
  if (!isPlainObject(snapshot.contract) || snapshot.contract.name !== 'ai-radar-daily-search' || !/^\d+\.\d+\.\d+$/.test(snapshot.contract.version || '')) {
    errors.push('snapshot.contract must identify ai-radar-daily-search with a semantic version');
  }
  if (!isDateTime(snapshot.generatedAt)) errors.push('snapshot.generatedAt must be an ISO date-time');
  if (!isPlainObject(snapshot.query)) {
    errors.push('snapshot.query must be an object');
  } else {
    rejectExtraKeys(snapshot.query, new Set(['topic', 'requestedCount', 'language', 'date']), 'snapshot.query', errors);
    if (!nonEmptyString(snapshot.query.topic)) errors.push('snapshot.query.topic is required');
    if (!Number.isInteger(snapshot.query.requestedCount) || snapshot.query.requestedCount < 1) errors.push('snapshot.query.requestedCount must be a positive integer');
    if (!nonEmptyString(snapshot.query.language) || snapshot.query.language.trim().length < 2) errors.push('snapshot.query.language is required');
    if (!isDate(snapshot.query.date)) errors.push('snapshot.query.date must be a date');
  }
  if (!Array.isArray(snapshot.signals) || snapshot.signals.length === 0) {
    errors.push('snapshot.signals must be a non-empty array');
  } else {
    snapshot.signals.forEach((signal, index) => validateSignal(signal, index, errors));
    const sourceUrls = snapshot.signals.map((signal) => signal?.source?.url).filter(isUrl);
    if (new Set(sourceUrls).size !== sourceUrls.length) errors.push('snapshot.signals contains duplicate source URLs');
  }
  return { valid: errors.length === 0, errors };
}

function validateSignal(signal, index, errors) {
  const path = `snapshot.signals[${index}]`;
  if (!isPlainObject(signal)) {
    errors.push(`${path} must be an object`);
    return;
  }
  rejectExtraKeys(signal, new Set(['id', 'title', 'source', 'evidence', 'impact', 'action', 'status']), path, errors);
  if (!signalIdPattern.test(signal.id || '')) errors.push(`${path}.id is invalid`);
  for (const field of ['title', 'evidence', 'impact', 'action']) if (!nonEmptyString(signal[field])) errors.push(`${path}.${field} is required`);
  if (!signalStatuses.has(signal.status)) errors.push(`${path}.status is invalid`);
  if (!isPlainObject(signal.source)) {
    errors.push(`${path}.source must be an object`);
    return;
  }
  rejectExtraKeys(signal.source, new Set(['publisher', 'url', 'publishedAt', 'type']), `${path}.source`, errors);
  if (!nonEmptyString(signal.source.publisher)) errors.push(`${path}.source.publisher is required`);
  if (!isUrl(signal.source.url)) errors.push(`${path}.source.url is invalid`);
  if (!isDate(signal.source.publishedAt)) errors.push(`${path}.source.publishedAt is invalid`);
  if (signal.source.type !== undefined && !['fuente_oficial', 'repo_tecnico', 'comunidad', 'medio_secundario'].includes(signal.source.type)) errors.push(`${path}.source.type is invalid`);
}

export function normalizeSnapshot(snapshot, snapshotName = null) {
  return {
    snapshotName,
    searchDate: snapshot.query.date,
    generatedAt: snapshot.generatedAt,
    signals: snapshot.signals.map((signal) => ({
      signal_id: signal.id,
      title: signal.title.trim(),
      evidence: signal.evidence.trim(),
      impact: signal.impact.trim(),
      action: signal.action.trim(),
      status: signal.status,
      source_publisher: signal.source.publisher.trim(),
      source_url: signal.source.url,
      source_type: signal.source.type || null,
      source_published_at: signal.source.publishedAt,
      generated_at: snapshot.generatedAt
    }))
  };
}

export function snapshotNameFromRequest(req) {
  const header = req.headers?.['x-airadar-snapshot'] || req.headers?.get?.('x-airadar-snapshot');
  return typeof header === 'string' && header.trim() ? header.trim().slice(0, 255) : null;
}
