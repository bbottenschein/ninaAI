-- Extras E1 (SPEC-extras.md): Komplimente für den Blütenregen.

create table public.compliments (
  id uuid primary key default gen_random_uuid(),
  text_en text not null check (char_length(btrim(text_en)) between 1 and 200),
  created_by text not null default 'admin' check (created_by in ('system', 'admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.compliment_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  compliment_id uuid not null references public.compliments (id) on delete cascade,
  shown_at timestamptz not null default now()
);
create index compliment_views_user_idx on public.compliment_views (user_id, compliment_id);

alter table public.compliments enable row level security;
alter table public.compliment_views enable row level security;

-- Alle Angemeldeten dürfen lesen (Nina nur aktive), bearbeiten nur die Admin-Rolle.
create policy "compliments: read" on public.compliments
  for select to authenticated
  using (active or (select public.is_admin()));
create policy "compliments: admin insert" on public.compliments
  for insert to authenticated
  with check ((select public.is_admin()) and created_by = 'admin');
create policy "compliments: admin update" on public.compliments
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "compliment_views: own" on public.compliment_views
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.compliments to authenticated;
grant select, insert on public.compliment_views to authenticated;
grant all on public.compliments, public.compliment_views to service_role;

insert into public.compliments (text_en, created_by)
select t, 'system' from (values
  ('You light up every room you walk into.'),
  ('Your smile makes my day better.'),
  ('You are kind in a way that makes people feel safe.'),
  ('You are stronger than you think.'),
  ('The world is better with you in it.'),
  ('You have a beautiful laugh.'),
  ('You make ordinary days feel special.'),
  ('You are so easy to talk to.'),
  ('Your heart is full of good things.'),
  ('You are brave, even on hard days.'),
  ('You always know how to make people smile.'),
  ('You are a wonderful friend.'),
  ('Your ideas are worth listening to.'),
  ('You make me proud every day.'),
  ('You are learning so much, and it shows.'),
  ('You have the best sense of humour.'),
  ('You are more amazing than you know.'),
  ('Being around you feels like sunshine.'),
  ('You make hard things look easy.'),
  ('Your kindness is never small.'),
  ('You are doing a great job.'),
  ('You deserve all the good things coming your way.'),
  ('You have a really warm heart.'),
  ('You make the people around you better.'),
  ('You are beautiful, inside and out.'),
  ('Your English gets better every day.'),
  ('You are a little bit of magic.'),
  ('You make home feel like home.'),
  ('You notice the small things, and that is a gift.'),
  ('You bring calm to every storm.'),
  ('You are someone people are happy to see.'),
  ('Your curiosity is wonderful.'),
  ('You are allowed to be proud of yourself today.'),
  ('You make life more colourful.'),
  ('You are one of a kind.'),
  ('Your energy is contagious.'),
  ('You are so good at caring for others.'),
  ('You never give up, and I love that about you.'),
  ('You have a smile that could stop traffic.'),
  ('You are worth every flower in the world.'),
  ('You make even rainy days feel bright.'),
  ('You are exactly enough, just as you are.'),
  ('You make me laugh like nobody else.'),
  ('Your hugs are the best medicine.'),
  ('You are growing in the most beautiful way.'),
  ('You have a gift for making people feel loved.'),
  ('You are the best part of my day.'),
  ('You shine, even when you are tired.'),
  ('You make the world softer and kinder.'),
  ('You are a reason to smile.')
) as v(t);
