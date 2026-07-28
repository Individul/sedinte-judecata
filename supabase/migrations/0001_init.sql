-- ============================================================================
--  Evidența ședințelor de judecată — schema inițială
--  Rulează acest fișier în Supabase → SQL Editor (o singură dată).
-- ============================================================================

-- ---------- Tipuri ----------
create type public.user_role as enum ('admin', 'operator', 'viewer');

-- ---------- Profiluri (extind auth.users cu rol) ----------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  role        public.user_role not null default 'viewer',
  created_at  timestamptz not null default now()
);

-- ---------- Ședințe zilnice (un rând pe zi, agregat pe toate judecătoriile) ----------
create table public.daily_sessions (
  id            uuid primary key default gen_random_uuid(),
  session_date  date not null unique,

  -- Teleconferință (introduse manual)
  tc_prezenti         integer not null default 0 check (tc_prezenti >= 0),
  tc_examinati_lipsa  integer not null default 0 check (tc_examinati_lipsa >= 0),
  tc_amanate          integer not null default 0 check (tc_amanate >= 0),

  -- Instanța de judecată (introduse manual)
  ij_prezenti         integer not null default 0 check (ij_prezenti >= 0),
  ij_examinati_lipsa  integer not null default 0 check (ij_examinati_lipsa >= 0),
  ij_amanate          integer not null default 0 check (ij_amanate >= 0),

  -- Totaluri calculate automat de Postgres
  tc_total integer generated always as
    (tc_prezenti + tc_examinati_lipsa + tc_amanate) stored,
  ij_total integer generated always as
    (ij_prezenti + ij_examinati_lipsa + ij_amanate) stored,
  total_general integer generated always as
    (tc_prezenti + tc_examinati_lipsa + tc_amanate
     + ij_prezenti + ij_examinati_lipsa + ij_amanate) stored,

  note        text,
  created_by  uuid references auth.users (id),
  updated_by  uuid references auth.users (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index daily_sessions_date_idx on public.daily_sessions (session_date);

-- ---------- Helper: rolul utilizatorului curent (security definer => evită recursivitatea RLS) ----------
create or replace function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

grant execute on function public.auth_role() to anon, authenticated;

-- ---------- updated_at automat ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger daily_sessions_set_updated_at
  before update on public.daily_sessions
  for each row execute function public.set_updated_at();

-- ---------- Creare automată profil la înregistrarea unui user ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'viewer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================ RLS ============================
alter table public.profiles       enable row level security;
alter table public.daily_sessions enable row level security;

-- profiles: îți vezi propriul profil; adminul vede și administrează tot
create policy "profiles_self_or_admin_read" on public.profiles
  for select using (id = auth.uid() or public.auth_role() = 'admin');

create policy "profiles_admin_write" on public.profiles
  for all using (public.auth_role() = 'admin')
  with check (public.auth_role() = 'admin');

-- daily_sessions: orice utilizator autentificat citește
create policy "sessions_read_authenticated" on public.daily_sessions
  for select using (auth.uid() is not null);

-- inserare/actualizare: operator + admin
create policy "sessions_insert_operator" on public.daily_sessions
  for insert with check (public.auth_role() in ('operator', 'admin'));

create policy "sessions_update_operator" on public.daily_sessions
  for update using (public.auth_role() in ('operator', 'admin'))
  with check (public.auth_role() in ('operator', 'admin'));

-- ștergere: doar admin
create policy "sessions_delete_admin" on public.daily_sessions
  for delete using (public.auth_role() = 'admin');

-- ---------- Privilegii de tabel (RLS rămâne cel care restrânge efectiv) ----------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.daily_sessions to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;

-- ============================================================================
--  BOOTSTRAP PRIMUL ADMIN
--  După ce creezi primul utilizator (Supabase → Authentication → Add user),
--  rulează, înlocuind email-ul:
--
--    update public.profiles set role = 'admin'
--    where id = (select id from auth.users where email = 'adminul-tau@exemplu.md');
-- ============================================================================
