-- HS GovTech Conference Navigator Supabase admin/backend expansion.
-- Safe to re-run after supabase-schema.sql and supabase-cutover.sql.

create extension if not exists pgcrypto;

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_at timestamptz not null default now()
);

create table if not exists public.podcast_episodes (
  id uuid primary key default gen_random_uuid(),
  video_id text unique,
  title text not null,
  description text,
  url text not null,
  thumbnail_url text,
  published_at timestamptz,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_schedule_email_log (
  id uuid primary key default gen_random_uuid(),
  schedule_date date not null,
  full_name text,
  agency text,
  email text not null,
  session_count integer not null default 0,
  status text not null,
  provider_message_id text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (schedule_date, email)
);

create table if not exists public.outbound_email_log (
  id uuid primary key default gen_random_uuid(),
  email_type text not null,
  recipient_email text not null,
  subject text,
  status text not null,
  provider_message_id text,
  error_message text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists podcast_episodes_active_idx
  on public.podcast_episodes (active, sort_order, published_at desc);

create index if not exists outbound_email_log_type_idx
  on public.outbound_email_log (email_type, created_at desc);

alter table public.app_settings enable row level security;
alter table public.podcast_episodes enable row level security;
alter table public.daily_schedule_email_log enable row level security;
alter table public.outbound_email_log enable row level security;

drop policy if exists "anon read active podcast episodes" on public.podcast_episodes;
create policy "anon read active podcast episodes" on public.podcast_episodes
  for select to anon
  using (active = true);

create or replace view public.public_podcast_episodes as
select
  video_id,
  title,
  description,
  url,
  thumbnail_url,
  published_at
from public.podcast_episodes
where active = true
order by sort_order asc, published_at desc nulls last, created_at desc;

grant select on public.public_podcast_episodes to anon;

create or replace view public.admin_leads_overview as
select
  submitted_at as activity_at,
  full_name,
  agency,
  email,
  source,
  page_url
from public.lead_captures
order by submitted_at desc;

create or replace view public.admin_demo_requests_overview as
select
  requested_at as activity_at,
  full_name,
  agency,
  email,
  phone,
  state,
  notes,
  source,
  page_url
from public.demo_requests
order by requested_at desc;

create or replace view public.admin_community_overview as
select
  posted_at as activity_at,
  'post' as item_type,
  post_id as item_id,
  null::text as parent_id,
  category,
  title,
  message,
  image_url,
  display_name,
  agency,
  email,
  status
from public.community_posts
union all
select
  posted_at as activity_at,
  'reply' as item_type,
  reply_id as item_id,
  post_id as parent_id,
  null::text as category,
  null::text as title,
  message,
  null::text as image_url,
  display_name,
  agency,
  email,
  status
from public.community_replies
order by activity_at desc;

create or replace view public.admin_trivia_scores_overview as
select
  completed_at as activity_at,
  board_id,
  board_name,
  display_name,
  full_name,
  agency,
  email,
  score,
  total,
  achievement,
  hints_used,
  round_id
from public.trivia_scores
order by completed_at desc;

insert into public.app_settings (key, value, description)
values
  ('conference', '{"name":"NEHA AEC 2026","timezone":"America/Chicago","dailyBriefHour":6}'::jsonb, 'Conference-level settings for the event app.'),
  ('email', '{"from":"NEHADailyBrief@conferenceguide.ai","fromName":"NEHA Daily Brief","replyTo":"NEHADailyBrief@conferenceguide.ai"}'::jsonb, 'Outbound email identity for Edge Functions.'),
  ('podcast', '{"channelUrl":"https://www.youtube.com/@beyonddatamanagement"}'::jsonb, 'Podcast refresh settings.')
on conflict (key) do update
set value = excluded.value,
    description = excluded.description,
    updated_at = now();

notify pgrst, 'reload schema';
