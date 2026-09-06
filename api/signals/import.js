import { snapshotNameFromRequest } from '../../src/signal-import.js';
import { importSnapshot } from '../../src/server/import-signals.js';
import { createSignalRepository, createSupabaseClient } from '../../src/server/supabase.js';

function authorized(header, secret) {
  return typeof secret === 'string' && secret.length > 0 && header === `Bearer ${secret}`;
}

export function createHandler({ environment = process.env, repositoryFactory } = {}) {
  return async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!authorized(req.headers?.authorization, environment.AIRADAR_INGEST_SECRET)) return res.status(401).json({ error: 'Unauthorized' });
    const repository = repositoryFactory ? repositoryFactory() : createSignalRepository(createSupabaseClient(environment));
    const result = await importSnapshot(req.body, { repository, snapshotName: snapshotNameFromRequest(req) });
    return res.status(result.status).json(result.body);
  };
}

export default createHandler();
