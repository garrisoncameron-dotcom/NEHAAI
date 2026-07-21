-- Supabase read/cutover migration for HS GovTech Conference Navigator.
-- Run after supabase-schema.sql. Safe to re-run.

alter table public.app_alerts add column if not exists view text not null default 'my';
alter table public.session_presentations add column if not exists speaker text;
alter table public.trivia_scores add column if not exists display_name text;

alter table public.drink_redemptions add column if not exists display_name text;
alter table public.drink_redemptions add column if not exists issued_at timestamptz;
alter table public.drink_redemptions add column if not exists status text not null default 'Issued';
alter table public.drink_redemptions add column if not exists served_at timestamptz;
alter table public.drink_redemptions add column if not exists served_by text;
alter table public.drink_redemptions add column if not exists user_agent text;

alter table public.community_posts add column if not exists display_name text;
alter table public.community_posts add column if not exists status text not null default 'Visible';
alter table public.community_replies add column if not exists display_name text;
alter table public.community_replies add column if not exists status text not null default 'Visible';

alter table public.session_questions add column if not exists title text;
alter table public.session_questions add column if not exists message text;
alter table public.session_questions add column if not exists session_time text;
alter table public.session_questions add column if not exists display_name text;
alter table public.session_questions add column if not exists status text not null default 'Visible';
alter table public.session_question_replies add column if not exists display_name text;
alter table public.session_question_replies add column if not exists status text not null default 'Visible';

update public.drink_redemptions
set display_name = coalesce(nullif(display_name, ''), nullif(split_part(full_name, ' ', 1), ''), 'NEHA attendee'),
    issued_at = coalesce(issued_at, redeemed_at),
    status = coalesce(nullif(status, ''), 'Issued');

update public.trivia_scores
set display_name = coalesce(nullif(display_name, ''), nullif(split_part(full_name, ' ', 1), ''), 'Mystery Player');

update public.community_posts
set display_name = coalesce(nullif(display_name, ''), nullif(split_part(full_name, ' ', 1), ''), 'NEHA attendee'),
    status = coalesce(nullif(status, ''), 'Visible');

update public.community_replies
set display_name = coalesce(nullif(display_name, ''), nullif(split_part(full_name, ' ', 1), ''), 'NEHA attendee'),
    status = coalesce(nullif(status, ''), 'Visible');

update public.session_questions
set title = coalesce(nullif(title, ''), nullif(question, ''), 'Session question'),
    message = coalesce(nullif(message, ''), nullif(question, ''), ''),
    display_name = coalesce(nullif(display_name, ''), nullif(split_part(full_name, ' ', 1), ''), 'NEHA attendee'),
    status = coalesce(nullif(status, ''), 'Visible');

update public.session_question_replies
set display_name = coalesce(nullif(display_name, ''), nullif(split_part(full_name, ' ', 1), ''), 'NEHA attendee'),
    status = coalesce(nullif(status, ''), 'Visible');

delete from public.app_alerts a
using public.app_alerts b
where a.ctid < b.ctid
  and a.title = b.title
  and a.message = b.message
  and coalesce(a.button_label, '') = coalesce(b.button_label, '')
  and coalesce(a.view, '') = coalesce(b.view, '');

create unique index if not exists app_alerts_seed_unique_idx
  on public.app_alerts (title, message, coalesce(button_label, ''), view);

insert into public.app_alerts (title, message, button_label, view, active, priority)
values
  ('Perfect scores win prizes', 'Finish 12 for 12 in EH Trivia, then visit the HS GovTech booth for a special prize.', 'Play Trivia', 'trivia', true, 1),
  ('Want a closer look?', 'Book a quick HS CloudSuite demo and someone will reach out after the conference.', 'Book Demo', 'demo', true, 2)
on conflict (title, message, coalesce(button_label, ''), view) do nothing;

drop policy if exists "anon read drink tickets" on public.drink_redemptions;
drop policy if exists "anon update drink tickets" on public.drink_redemptions;
drop policy if exists "anon read community posts" on public.community_posts;
drop policy if exists "anon read community replies" on public.community_replies;
drop policy if exists "anon read session questions" on public.session_questions;
drop policy if exists "anon read session question replies" on public.session_question_replies;
drop policy if exists "anon read trivia scores" on public.trivia_scores;

create policy "anon read drink tickets" on public.drink_redemptions
  for select to anon
  using (true);

create policy "anon update drink tickets" on public.drink_redemptions
  for update to anon
  using (true)
  with check (true);

create policy "anon read community posts" on public.community_posts
  for select to anon
  using (status <> 'Hidden');

create policy "anon read community replies" on public.community_replies
  for select to anon
  using (status <> 'Hidden');

create policy "anon read session questions" on public.session_questions
  for select to anon
  using (status <> 'Hidden');

create policy "anon read session question replies" on public.session_question_replies
  for select to anon
  using (status <> 'Hidden');

create policy "anon read trivia scores" on public.trivia_scores
  for select to anon
  using (true);

revoke select on public.drink_redemptions from anon;
revoke select on public.community_posts from anon;
revoke select on public.community_replies from anon;
revoke select on public.session_questions from anon;
revoke select on public.session_question_replies from anon;
revoke select on public.trivia_scores from anon;

grant select (
  redemption_code,
  display_name,
  full_name,
  agency,
  issued_at,
  status,
  served_at,
  served_by,
  redeemed_at
) on public.drink_redemptions to anon;

grant update (
  status,
  served_at,
  served_by
) on public.drink_redemptions to anon;

grant select (
  post_id,
  category,
  title,
  message,
  image_url,
  display_name,
  agency,
  share_email,
  posted_at,
  created_at
) on public.community_posts to anon;

grant select (
  post_id,
  message,
  display_name,
  agency,
  posted_at,
  created_at
) on public.community_replies to anon;

grant select (
  question_id,
  session_id,
  title,
  message,
  display_name,
  agency,
  posted_at,
  created_at
) on public.session_questions to anon;

grant select (
  question_id,
  session_id,
  message,
  display_name,
  agency,
  posted_at,
  created_at
) on public.session_question_replies to anon;

grant select (
  display_name,
  agency,
  score,
  total,
  achievement,
  hints_used,
  board_id,
  board_name,
  completed_at,
  created_at
) on public.trivia_scores to anon;

create or replace view public.public_drink_redemptions as
select
  redemption_code,
  display_name,
  full_name,
  agency,
  issued_at,
  status,
  served_at,
  served_by,
  redeemed_at
from public.drink_redemptions;

create or replace view public.public_community_posts as
select
  post_id,
  category,
  title,
  message,
  image_url,
  display_name,
  agency,
  share_email,
  posted_at,
  created_at
from public.community_posts
where status <> 'Hidden';

create or replace view public.public_community_replies as
select
  post_id,
  message,
  display_name,
  agency,
  posted_at,
  created_at
from public.community_replies
where status <> 'Hidden';

create or replace view public.public_session_questions as
select
  question_id,
  session_id,
  title,
  message,
  display_name,
  agency,
  posted_at,
  created_at
from public.session_questions
where status <> 'Hidden';

create or replace view public.public_session_question_replies as
select
  question_id,
  session_id,
  message,
  display_name,
  agency,
  posted_at,
  created_at
from public.session_question_replies
where status <> 'Hidden';

create or replace view public.public_trivia_scores as
select
  display_name,
  agency,
  score,
  total,
  achievement,
  hints_used,
  board_id,
  board_name,
  completed_at,
  created_at
from public.trivia_scores;

grant select on public.public_drink_redemptions to anon;
grant select on public.public_community_posts to anon;
grant select on public.public_community_replies to anon;
grant select on public.public_session_questions to anon;
grant select on public.public_session_question_replies to anon;
grant select on public.public_trivia_scores to anon;

insert into storage.buckets (id, name, public)
values ('community-images', 'community-images', true)
on conflict (id) do update set public = true;

drop policy if exists "anon read community images" on storage.objects;
drop policy if exists "anon upload community images" on storage.objects;

create policy "anon read community images" on storage.objects
  for select to anon
  using (bucket_id = 'community-images');

create policy "anon upload community images" on storage.objects
  for insert to anon
  with check (bucket_id = 'community-images');

notify pgrst, 'reload schema';
