-- Extras E2 (SPEC-extras.md): Love Notes zwischen Nina und Benedikt.

create table public.love_notes (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  text text not null check (char_length(btrim(text)) between 1 and 150),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  is_favorite_sender boolean not null default false,
  is_favorite_recipient boolean not null default false,
  check (sender_id <> recipient_id)
);
create index love_notes_recipient_idx on public.love_notes (recipient_id, created_at desc);
create index love_notes_sender_idx on public.love_notes (sender_id, created_at desc);

alter table public.love_notes enable row level security;

-- Empfänger muss das jeweils andere Konto sein (Spielerin ↔ Admin).
create function public.is_love_partner(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles me
    join public.profiles other on other.id = p_user
    where me.id = (select auth.uid()) and other.id <> me.id and other.role <> me.role
  );
$$;

-- Lesen nur für Absender und Empfänger.
create policy "love_notes: sender or recipient" on public.love_notes
  for select to authenticated
  using (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()));

create policy "love_notes: send" on public.love_notes
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (select public.is_love_partner(recipient_id))
    and read_at is null
    and not is_favorite_sender
    and not is_favorite_recipient
  );

-- Änderungen nur über Funktionen: read_at setzt nur der Empfänger, Favorit jede Seite für sich.
create function public.mark_love_notes_read()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.love_notes set read_at = now()
  where recipient_id = (select auth.uid()) and read_at is null;
$$;

create function public.toggle_love_note_favorite(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  result boolean;
begin
  update public.love_notes
  set is_favorite_sender = case when sender_id = (select auth.uid()) then not is_favorite_sender else is_favorite_sender end,
      is_favorite_recipient = case when recipient_id = (select auth.uid()) then not is_favorite_recipient else is_favorite_recipient end
  where id = p_id and (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()))
  returning case when sender_id = (select auth.uid()) then is_favorite_sender else is_favorite_recipient end
  into result;
  if result is null then
    raise exception 'love note not found';
  end if;
  return result;
end;
$$;

revoke execute on function public.is_love_partner(uuid) from public, anon;
revoke execute on function public.mark_love_notes_read() from public, anon;
revoke execute on function public.toggle_love_note_favorite(uuid) from public, anon;
grant execute on function public.is_love_partner(uuid) to authenticated;
grant execute on function public.mark_love_notes_read() to authenticated;
grant execute on function public.toggle_love_note_favorite(uuid) to authenticated;

grant select, insert on public.love_notes to authenticated;
grant all on public.love_notes to service_role;
