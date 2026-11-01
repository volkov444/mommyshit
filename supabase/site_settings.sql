-- Run this once in your Supabase project's SQL Editor (after users_schema.sql,
-- for public.is_admin()). Moves the admin Settings page's Umum/Website/
-- Notifikasi tabs off per-browser localStorage ("bluffy_demo_admin_settings")
-- and into a real, shared table — so a change one admin makes is visible to
-- every admin, on every device, instead of living only in whoever's browser
-- saved it last.

-- Singleton row pattern: id is always 1, enforced by the check constraint,
-- so there is exactly one settings row ever.
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  site_name text not null default 'Bluffy',
  logo_url text not null default '/logo.svg',
  description text not null default 'Virtual numbers made simple.',
  landing_headline text not null default 'Virtual Numbers Made Simple',
  contact_email text not null default 'support@bluffy.app',
  contact_phone text not null default '+62 812-0000-0000',
  support_hours text not null default 'Senin–Minggu, 08.00–22.00 WIB',
  notify_new_deposit boolean not null default true,
  notify_new_order boolean not null default true,
  notify_new_ticket boolean not null default true,
  notify_low_stock boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

alter table public.site_settings enable row level security;

create policy "Admins can read site settings" on public.site_settings for select
  using (public.is_admin());
create policy "Admins can update site settings" on public.site_settings for update
  using (public.is_admin()) with check (public.is_admin());
