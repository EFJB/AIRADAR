import { normalizeSnapshot, validateSnapshot } from '../signal-import.js';

function safeError(error) {
  return error instanceof Error ? error.message.slice(0, 500) : 'Unexpected persistence error';
}

export async function importSnapshot(snapshot, { repository, snapshotName = null }) {
  const validation = validateSnapshot(snapshot);
  if (!validation.valid) return { ok: false, status: 400, body: { error: 'Invalid snapshot', details: validation.errors } };

  const normalized = normalizeSnapshot(snapshot, snapshotName);
  const totalSignals = normalized.signals.length;
  try {
    const existingUrls = await repository.existingSourceUrls(normalized.signals.map((signal) => signal.source_url));
    const newSignals = normalized.signals.filter((signal) => !existingUrls.has(signal.source_url));
    const inserted = await repository.insertSignals(newSignals);
    const body = { created: inserted.length, skipped: totalSignals - inserted.length, errors: 0 };
    await repository.recordRun({
      snapshot_name: normalized.snapshotName,
      search_date: normalized.searchDate,
      total_signals: totalSignals,
      created_count: body.created,
      skipped_count: body.skipped,
      error_count: 0,
      result: 'success',
      error_message: null
    });
    return { ok: true, status: 200, body };
  } catch (error) {
    const message = safeError(error);
    try {
      await repository.recordRun({
        snapshot_name: normalized.snapshotName,
        search_date: normalized.searchDate,
        total_signals: totalSignals,
        created_count: 0,
        skipped_count: 0,
        error_count: totalSignals,
        result: 'error',
        error_message: message
      });
    } catch {
      // Preserve the primary persistence failure; audit storage may be unavailable too.
    }
    return { ok: false, status: 500, body: { error: 'Signal persistence failed', details: message } };
  }
}
