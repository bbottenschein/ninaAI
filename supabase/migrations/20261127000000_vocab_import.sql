-- NinAI – Phase 5: Vokabeln aus der Tageslektion automatisch übernehmen.
-- Sobald eine Lektion fertig ist (status = 'ready'), landen ihre markierten Vokabeln
-- in der Sammlung jeder Spielerin. Bereits vorhandene Wörter bleiben unverändert
-- (eindeutig pro Spielerin, ohne Groß-/Kleinschreibung).

create function public.import_lesson_vocab(p_date date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  insert into public.vocab (user_id, word_en, translation_de, explanation, example, source_date)
  select distinct on (p.id, lower(trim(v ->> 'word')))
         p.id,
         trim(v ->> 'word'),
         coalesce(v ->> 'translation_de', ''),
         coalesce(v ->> 'explanation', ''),
         coalesce(v ->> 'example', ''),
         l.date
    from public.daily_lessons l
   cross join lateral jsonb_array_elements(l.news) as n
   cross join lateral jsonb_array_elements(coalesce(n -> 'vocab', '[]'::jsonb)) as v
   cross join public.profiles p
   where l.date = p_date
     and l.status = 'ready'
     and p.role = 'player'
     and length(trim(coalesce(v ->> 'word', ''))) > 0
  on conflict do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.import_lesson_vocab(date) from public, anon, authenticated;
grant execute on function public.import_lesson_vocab(date) to service_role;

create function public.handle_lesson_ready()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.import_lesson_vocab(new.date);
  return new;
end;
$$;

revoke execute on function public.handle_lesson_ready() from public, anon, authenticated;

create trigger on_lesson_ready
  after insert or update of status on public.daily_lessons
  for each row
  when (new.status = 'ready')
  execute function public.handle_lesson_ready();

-- Vokabeln der bereits fertigen Lektionen nachholen.
select public.import_lesson_vocab(date) from public.daily_lessons where status = 'ready';
