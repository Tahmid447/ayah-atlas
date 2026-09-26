-- Quran-only data. Run in the Black Choco Quran project, never the English project.
create table if not exists public.atlas_items (
 user_id uuid not null references auth.users(id) on delete cascade,
 key text not null check (length(key) between 1 and 180),
 value jsonb,
 version bigint not null default 1,
 updated_at timestamptz not null default now(),
 primary key(user_id,key),
 constraint atlas_item_size check (octet_length(value::text) <= 2097152)
);
alter table public.atlas_items enable row level security;
revoke all on public.atlas_items from anon, authenticated;
grant select on public.atlas_items to authenticated;
drop policy if exists "Owner reads private Quran workspace" on public.atlas_items;
create policy "Owner reads private Quran workspace" on public.atlas_items for select to authenticated using ((select auth.uid()) = user_id);
-- Optimistic version check prevents concurrent devices silently replacing notes.
create or replace function public.atlas_save_item(p_key text, p_value jsonb, p_expected bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); next_version bigint;
begin
 if uid is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if length(p_key)>180 or p_key !~ '^(atlas\.|fq)' then raise exception 'Invalid workspace key'; end if;
 if octet_length(p_value::text)>2097152 then raise exception 'Entry exceeds 2 MB'; end if;
 if p_expected=0 then
  insert into public.atlas_items(user_id,key,value) values(uid,p_key,p_value) on conflict do nothing returning version into next_version;
 else
  update public.atlas_items set value=p_value,version=version+1,updated_at=now() where user_id=uid and key=p_key and version=p_expected returning version into next_version;
 end if;
 if next_version is null then raise exception 'This entry changed on another device' using errcode='40001'; end if;
 return next_version;
end $$;
revoke all on function public.atlas_save_item(text,jsonb,bigint) from public,anon;
grant execute on function public.atlas_save_item(text,jsonb,bigint) to authenticated;
