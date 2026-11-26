-- NinAI – Modul „Remind me“, Phase R1: Listen und Aufgaben.
-- Siehe SPEC-remind-me.md › Datenmodell & Jobs und › Privatsphäre.
-- Privat: nur die Besitzerin liest und schreibt. Die Admin-Rolle bekommt hier
-- ausdrücklich keinen Zugriff (anders als bei Streak und Gutscheinen).

create table public.todo_lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  area text not null check (area in ('work', 'life')),
  name text not null check (length(trim(name)) between 1 and 60),
  color text,
  sort_order integer not null default 0,
  -- Für die spätere gemeinsame Liste (Phase R4). Noch ohne Policy, also ohne Wirkung.
  shared_with uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index todo_lists_owner_idx on public.todo_lists (owner_id, area, sort_order);
-- Work Mode hat genau eine Liste („Job“).
create unique index todo_lists_one_work_list on public.todo_lists (owner_id) where area = 'work';

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.todo_lists (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  note text not null default '',
  due_date date,
  due_time time,
  remind_at timestamptz,
  repeat_rule text,
  priority boolean not null default false,
  completed_at timestamptz,
  reminder_sent_at timestamptz,
  snoozed_until timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_via text not null default 'form' check (created_via in ('form', 'ai_text', 'ai_voice')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_time is null or due_date is not null)
);
create index todos_owner_open_idx on public.todos (owner_id, due_date) where completed_at is null;
create index todos_owner_done_idx on public.todos (owner_id, completed_at desc) where completed_at is not null;
create index todos_list_idx on public.todos (list_id);
-- Für den Erinnerungs-Job (Phase R2).
create index todos_reminder_idx on public.todos (coalesce(snoozed_until, remind_at))
  where completed_at is null and reminder_sent_at is null;

alter table public.todo_lists enable row level security;
alter table public.todos enable row level security;

create policy "todo_lists: own" on public.todo_lists
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- Aufgaben nur in eigenen Listen.
create policy "todos: own" on public.todos
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.todo_lists l
       where l.id = list_id and l.owner_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on public.todo_lists to authenticated;
grant select, insert, update, delete on public.todos to authenticated;
grant all on public.todo_lists to service_role;
grant all on public.todos to service_role;

-- Startlisten: Job (Work Mode) sowie Allgemein, Einkauf, Haushalt (Life Mode).
-- Wird beim ersten Öffnen von „Remind me“ aufgerufen; legt nur an, was fehlt.
create function public.ensure_todo_lists()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    return;
  end if;
  if not exists (select 1 from public.todo_lists where owner_id = v_user) then
    insert into public.todo_lists (owner_id, area, name, sort_order) values
      (v_user, 'work', 'Job', 0),
      (v_user, 'life', 'Allgemein', 0),
      (v_user, 'life', 'Einkauf', 1),
      (v_user, 'life', 'Haushalt', 2);
  end if;
end;
$$;

revoke execute on function public.ensure_todo_lists() from public, anon;
grant execute on function public.ensure_todo_lists() to authenticated;
