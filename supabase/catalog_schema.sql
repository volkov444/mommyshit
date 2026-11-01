-- Run this once in your Supabase project's SQL Editor (after schema.sql).
-- Moves the service/country/price-tier catalog off per-browser
-- localStorage and into real tables, so every user and every admin session
-- sees the same Buy Number catalog instead of whatever one browser's
-- localStorage happened to contain.

create table if not exists public.countries (
  code text primary key,
  name text not null,
  flag text not null,
  dial_code text not null
);

create table if not exists public.services (
  id text primary key,
  name text not null,
  icon text not null,
  description text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.price_tiers (
  id text primary key,
  service_id text not null references public.services (id) on delete cascade,
  country_code text not null references public.countries (code) on delete cascade,
  supplier_price numeric not null default 0,
  sell_price numeric not null default 0,
  stock integer not null default 0,
  active boolean not null default true
);

create index if not exists price_tiers_service_country_idx on public.price_tiers (service_id, country_code);

alter table public.countries enable row level security;
alter table public.services enable row level security;
alter table public.price_tiers enable row level security;

-- Anyone (including anonymous visitors browsing Buy Number) can read the
-- catalog. Only admins can write to it.
create policy "Public can read countries" on public.countries for select using (true);
create policy "Public can read services" on public.services for select using (true);
create policy "Public can read price tiers" on public.price_tiers for select using (true);

create policy "Admins can write countries" on public.countries for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Admins can write services" on public.services for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Admins can write price tiers" on public.price_tiers for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- The 10 countries Bluffy originally shipped with. Services/price tiers
-- start empty — import them the same way as before (Admin > Supplier >
-- Lihat Katalog), just writing to these tables instead of localStorage now.
insert into public.countries (code, name, flag, dial_code) values
  ('ID', 'Indonesia', '🇮🇩', '+62'),
  ('US', 'United States', '🇺🇸', '+1'),
  ('GB', 'United Kingdom', '🇬🇧', '+44'),
  ('SG', 'Singapore', '🇸🇬', '+65'),
  ('MY', 'Malaysia', '🇲🇾', '+60'),
  ('IN', 'India', '🇮🇳', '+91'),
  ('DE', 'Germany', '🇩🇪', '+49'),
  ('FR', 'France', '🇫🇷', '+33'),
  ('BR', 'Brazil', '🇧🇷', '+55'),
  ('VN', 'Vietnam', '🇻🇳', '+84')
on conflict (code) do nothing;
