-- HS GovTech Conference Navigator Supabase foundation.
-- Google Sheets can stay primary while these tables receive mirrored writes.

create extension if not exists pgcrypto;

create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  email text,
  source text,
  page_url text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_captures (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  agency text,
  email text,
  source text,
  page_url text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  agency text,
  email text,
  phone text,
  state text,
  notes text,
  source text,
  page_url text,
  requested_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.trivia_scores (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  agency text,
  email text,
  board_id text not null default 'food',
  board_name text,
  score integer,
  total integer,
  achievement text,
  hints_used integer,
  round_id text,
  started_at timestamptz,
  completed_at timestamptz not null default now(),
  source text,
  page_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.drink_redemptions (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  agency text,
  email text,
  redemption_code text unique,
  redeemed_at timestamptz not null default now(),
  source text,
  page_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.drink_redemption_events (
  id uuid primary key default gen_random_uuid(),
  redemption_code text,
  event_type text not null,
  served_by text,
  raw_payload jsonb,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  post_id text unique not null,
  category text,
  title text,
  message text,
  image_name text,
  image_mime text,
  image_url text,
  share_email boolean not null default false,
  full_name text,
  agency text,
  email text,
  source text,
  page_url text,
  posted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.community_replies (
  id uuid primary key default gen_random_uuid(),
  reply_id text unique not null,
  post_id text not null,
  message text,
  full_name text,
  agency text,
  email text,
  source text,
  page_url text,
  posted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.session_questions (
  id uuid primary key default gen_random_uuid(),
  question_id text unique not null,
  session_id text,
  session_title text,
  question text,
  full_name text,
  agency text,
  email text,
  source text,
  page_url text,
  posted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.session_question_replies (
  id uuid primary key default gen_random_uuid(),
  reply_id text unique not null,
  question_id text not null,
  session_id text,
  message text,
  full_name text,
  agency text,
  email text,
  source text,
  page_url text,
  posted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.schedule_email_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  agency text,
  email text,
  recipient_email text,
  schedule_items jsonb,
  source text,
  page_url text,
  requested_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.session_notes_email_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  agency text,
  email text,
  recipient_email text,
  session_id text,
  session_title text,
  notes text,
  source text,
  page_url text,
  requested_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.synced_schedules (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  schedule_items jsonb,
  source text,
  page_url text,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.app_alerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  button_label text,
  button_url text,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  priority integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.session_presentations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  title text not null,
  url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists trivia_scores_board_score_idx
  on public.trivia_scores (board_id, score desc, completed_at asc);
create index if not exists community_posts_category_idx
  on public.community_posts (category, posted_at desc);
create index if not exists community_replies_post_idx
  on public.community_replies (post_id, posted_at asc);
create index if not exists session_questions_session_idx
  on public.session_questions (session_id, posted_at desc);
create index if not exists synced_schedules_email_idx
  on public.synced_schedules (email, synced_at desc);

alter table public.app_events enable row level security;
alter table public.lead_captures enable row level security;
alter table public.demo_requests enable row level security;
alter table public.trivia_scores enable row level security;
alter table public.drink_redemptions enable row level security;
alter table public.drink_redemption_events enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_replies enable row level security;
alter table public.session_questions enable row level security;
alter table public.session_question_replies enable row level security;
alter table public.schedule_email_requests enable row level security;
alter table public.session_notes_email_requests enable row level security;
alter table public.synced_schedules enable row level security;
alter table public.app_alerts enable row level security;
alter table public.session_presentations enable row level security;

drop policy if exists "anon insert app events" on public.app_events;
drop policy if exists "anon insert leads" on public.lead_captures;
drop policy if exists "anon insert demo requests" on public.demo_requests;
drop policy if exists "anon insert trivia scores" on public.trivia_scores;
drop policy if exists "anon insert drink redemptions" on public.drink_redemptions;
drop policy if exists "anon insert drink events" on public.drink_redemption_events;
drop policy if exists "anon insert community posts" on public.community_posts;
drop policy if exists "anon insert community replies" on public.community_replies;
drop policy if exists "anon insert session questions" on public.session_questions;
drop policy if exists "anon insert session question replies" on public.session_question_replies;
drop policy if exists "anon insert schedule email requests" on public.schedule_email_requests;
drop policy if exists "anon insert notes email requests" on public.session_notes_email_requests;
drop policy if exists "anon insert synced schedules" on public.synced_schedules;
drop policy if exists "anon read active alerts" on public.app_alerts;
drop policy if exists "anon read active presentations" on public.session_presentations;

create policy "anon insert app events" on public.app_events for insert to anon with check (true);
create policy "anon insert leads" on public.lead_captures for insert to anon with check (true);
create policy "anon insert demo requests" on public.demo_requests for insert to anon with check (true);
create policy "anon insert trivia scores" on public.trivia_scores for insert to anon with check (true);
create policy "anon insert drink redemptions" on public.drink_redemptions for insert to anon with check (true);
create policy "anon insert drink events" on public.drink_redemption_events for insert to anon with check (true);
create policy "anon insert community posts" on public.community_posts for insert to anon with check (true);
create policy "anon insert community replies" on public.community_replies for insert to anon with check (true);
create policy "anon insert session questions" on public.session_questions for insert to anon with check (true);
create policy "anon insert session question replies" on public.session_question_replies for insert to anon with check (true);
create policy "anon insert schedule email requests" on public.schedule_email_requests for insert to anon with check (true);
create policy "anon insert notes email requests" on public.session_notes_email_requests for insert to anon with check (true);
create policy "anon insert synced schedules" on public.synced_schedules for insert to anon with check (true);

create policy "anon read active alerts" on public.app_alerts
  for select to anon
  using (
    active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

create policy "anon read active presentations" on public.session_presentations
  for select to anon
  using (active = true);
