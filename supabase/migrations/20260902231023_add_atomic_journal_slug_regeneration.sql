create or replace function public.save_journal_with_places_and_regenerate_slug(
  p_journal_id uuid,
  p_user_id uuid,
  p_title text,
  p_blocks jsonb,
  p_thumbnail_asset_id uuid,
  p_date date,
  p_updated_at timestamptz,
  p_places jsonb,
  p_orphaned_asset_ids uuid[]
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  base_slug text;
  candidate_slug text;
  current_slug text;
begin
  perform public.save_journal_with_places(
    p_journal_id,
    p_user_id,
    p_title,
    p_blocks,
    p_thumbnail_asset_id,
    p_date,
    p_updated_at,
    p_places
  );

  select slug
  into current_slug
  from public.journals
  where id = p_journal_id
    and user_id = p_user_id
  for update;

  base_slug := pg_catalog.lower(
    pg_catalog.regexp_replace(
      pg_catalog.regexp_replace(
        coalesce(nullif(pg_catalog.btrim(p_title), ''), 'untitled'),
        '[^a-zA-Z0-9\s-]',
        '',
        'g'
      ),
      '[\s-]+',
      '-',
      'g'
    )
  );

  base_slug := pg_catalog.btrim(base_slug, '-');

  if base_slug = '' then
    base_slug := 'untitled';
  end if;

  if current_slug = base_slug
    or current_slug ~ (
      '^' || base_slug ||
      '-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ) then
    raise exception 'Journal slug is already current';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text || ':' || base_slug, 0)
  );

  candidate_slug := base_slug;

  if exists (
    select 1
    from public.journals
    where user_id = p_user_id
      and slug = candidate_slug
      and id <> p_journal_id
  ) then
    loop
      candidate_slug := base_slug || '-' || pg_catalog.gen_random_uuid()::text;

      exit when not exists (
        select 1
        from public.journals
        where user_id = p_user_id
          and slug = candidate_slug
          and id <> p_journal_id
      );
    end loop;
  end if;

  update public.journals
  set slug = candidate_slug
  where id = p_journal_id
    and user_id = p_user_id;

  delete from public.journal_assets
  where journal_id = p_journal_id
    and user_id = p_user_id
    and id = any(coalesce(p_orphaned_asset_ids, array[]::uuid[]));

  return candidate_slug;
end;
$$;

revoke all on function public.save_journal_with_places_and_regenerate_slug(
  uuid,
  uuid,
  text,
  jsonb,
  uuid,
  date,
  timestamptz,
  jsonb,
  uuid[]
) from public, anon, authenticated;

grant execute on function public.save_journal_with_places_and_regenerate_slug(
  uuid,
  uuid,
  text,
  jsonb,
  uuid,
  date,
  timestamptz,
  jsonb,
  uuid[]
) to service_role;

comment on function public.save_journal_with_places_and_regenerate_slug(
  uuid,
  uuid,
  text,
  jsonb,
  uuid,
  date,
  timestamptz,
  jsonb,
  uuid[]
) is
  'Atomically saves an owned journal and regenerates its per-user slug when the current slug is stale or uses the legacy double-dash format.';
