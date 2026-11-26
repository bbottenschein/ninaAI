-- NinAI – Remind me, Phase R2: Erinnerungs-Job jede Minute.
-- Die Route verschickt fällige Erinnerungen (remind_at bzw. snoozed_until ≤ jetzt,
-- reminder_sent_at leer) und markiert sie als verschickt.
select cron.schedule('ninaai-todo-reminders', '* * * * *', $$select public.call_job('/api/jobs/todo-reminders')$$);
