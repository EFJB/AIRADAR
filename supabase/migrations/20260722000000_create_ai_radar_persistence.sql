create table public.signals (
  id uuid primary key default gen_random_uuid(),
  signal_id text not null,
  title text not null,
  evidence text not null,
  impact text not null,
  action text not null,
  status text not null check (status in ('new', 'active', 'watch', 'pilot', 'alert')),
  source_publisher text not null,
  source_url text not null unique,
  source_type text,
  source_published_at date not null,
  generated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  snapshot_name text,
  search_date date not null,
  total_signals integer not null check (total_signals >= 0),
  created_count integer not null check (created_count >= 0),
  skipped_count integer not null check (skipped_count >= 0),
  error_count integer not null check (error_count >= 0),
  result text not null check (result in ('success', 'error')),
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.signals enable row level security;
alter table public.ingestion_runs enable row level security;
