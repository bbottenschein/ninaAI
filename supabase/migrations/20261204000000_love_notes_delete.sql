-- Love Notes löschen (SPEC-extras): „nur für mich“. Erst wenn beide gelöscht haben, verschwindet die Zeile.

alter table public.love_notes
  add column deleted_by_sender boolean not null default false,
  add column deleted_by_recipient boolean not null default false;

drop policy "love_notes: sender or recipient" on public.love_notes;
create policy "love_notes: sender or recipient" on public.love_notes
  for select to authenticated
  using (
    (sender_id = (select auth.uid()) and not deleted_by_sender)
    or (recipient_id = (select auth.uid()) and not deleted_by_recipient)
  );

drop policy "love_notes: send" on public.love_notes;
create policy "love_notes: send" on public.love_notes
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (select public.is_love_partner(recipient_id))
    and read_at is null
    and not is_favorite_sender
    and not is_favorite_recipient
    and not deleted_by_sender
    and not deleted_by_recipient
  );

create function public.delete_love_note(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.love_notes
  set deleted_by_sender = deleted_by_sender or sender_id = (select auth.uid()),
      deleted_by_recipient = deleted_by_recipient or recipient_id = (select auth.uid()),
      read_at = case when recipient_id = (select auth.uid()) then coalesce(read_at, now()) else read_at end
  where id = p_id and (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()));
  if not found then
    raise exception 'love note not found';
  end if;
  delete from public.love_notes where id = p_id and deleted_by_sender and deleted_by_recipient;
end;
$$;

revoke execute on function public.delete_love_note(uuid) from public, anon;
grant execute on function public.delete_love_note(uuid) to authenticated;
