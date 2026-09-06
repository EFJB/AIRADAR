import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient(environment = process.env) {
  const url = environment.SUPABASE_URL;
  const serviceRoleKey = environment.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error('Supabase server credentials are not configured');
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export function createSignalRepository(client) {
  return {
    async existingSourceUrls(urls) {
      if (urls.length === 0) return new Set();
      const { data, error } = await client.from('signals').select('source_url').in('source_url', urls);
      if (error) throw error;
      return new Set(data.map((row) => row.source_url));
    },
    async insertSignals(signals) {
      if (signals.length === 0) return [];
      const { data, error } = await client.from('signals').insert(signals).select('id');
      if (error) throw error;
      return data;
    },
    async recordRun(run) {
      const { error } = await client.from('ingestion_runs').insert(run);
      if (error) throw error;
    }
  };
}
