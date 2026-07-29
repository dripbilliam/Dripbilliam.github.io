-- CharDB schema for account-owned character sheets.
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.character_sheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_name text not null,
  race text not null default '',
  tags text not null default '',
  alignment text not null default '',
  is_public boolean not null default false,
  share_enabled boolean not null default false,
  share_token text,
  level_data jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.character_sheets
add column if not exists character_name text;

alter table public.character_sheets
add column if not exists race text not null default '';

alter table public.character_sheets
add column if not exists tags text not null default '';

alter table public.character_sheets
add column if not exists alignment text not null default '';

alter table public.character_sheets
add column if not exists level_data jsonb not null default '[]'::jsonb;

update public.character_sheets
set character_name = 'Untitled'
where character_name is null or btrim(character_name) = '';

alter table public.character_sheets
alter column character_name set not null;

alter table public.character_sheets
alter column race set default '';

alter table public.character_sheets
alter column tags set default '';

alter table public.character_sheets
alter column alignment set default '';

alter table public.character_sheets
alter column level_data set default '[]'::jsonb;

alter table public.character_sheets
add column if not exists is_public boolean not null default false;

alter table public.character_sheets
add column if not exists share_enabled boolean not null default false;

alter table public.character_sheets
add column if not exists share_token text;

alter table public.character_sheets
alter column share_enabled set default false;

create unique index if not exists idx_character_sheets_share_token_unique
on public.character_sheets (share_token)
where share_token is not null;

create index if not exists idx_character_sheets_is_public_updated
on public.character_sheets (is_public, updated_at desc);

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.get_shared_sheet(p_token text)
returns table (
  id uuid,
  character_name text,
  race text,
  tags text,
  alignment text,
  level_data jsonb,
  updated_at timestamptz,
  is_public boolean
)
language sql
security definer
set search_path = public
as $$
  select
    s.id,
    s.character_name,
    s.race,
    s.tags,
    s.alignment,
    s.level_data,
    s.updated_at,
    s.is_public
  from public.character_sheets s
  where s.share_enabled = true
    and s.share_token = nullif(btrim(p_token), '')
  limit 1;
$$;

drop trigger if exists trg_character_sheets_updated_at on public.character_sheets;
create trigger trg_character_sheets_updated_at
before update on public.character_sheets
for each row
execute function public.set_row_updated_at();

alter table public.character_sheets enable row level security;

drop policy if exists "character_sheets_select_own" on public.character_sheets;
create policy "character_sheets_select_own"
on public.character_sheets
for select
using (auth.uid() = user_id or is_public = true);

drop policy if exists "character_sheets_insert_own" on public.character_sheets;
create policy "character_sheets_insert_own"
on public.character_sheets
for insert
with check (auth.uid() = user_id);

drop policy if exists "character_sheets_update_own" on public.character_sheets;
create policy "character_sheets_update_own"
on public.character_sheets
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "character_sheets_delete_own" on public.character_sheets;
create policy "character_sheets_delete_own"
on public.character_sheets
for delete
using (auth.uid() = user_id);

-- Explicit grants help when Data API auto-exposure is disabled for new tables.
grant usage on schema public to anon, authenticated;
grant select on table public.character_sheets to anon;
grant select, insert, update, delete on table public.character_sheets to authenticated;
grant execute on function public.get_shared_sheet(text) to anon, authenticated;