-- ============================================================================
--  Autentificare cu nume de utilizator (username) în loc de email
--  Rulează în Supabase → SQL Editor, o singură dată, DUPĂ 0001_init.sql.
-- ============================================================================

-- 1) Coloana username pe profiluri (stocat în minuscule)
alter table public.profiles add column if not exists username text;

-- 2) Backfill pentru conturile existente: username = partea din email dinaintea @
update public.profiles p
set username = lower(split_part(u.email, '@', 1))
from auth.users u
where u.id = p.id
  and p.username is null
  and u.email is not null;

-- 3) Unicitate
create unique index if not exists profiles_username_key on public.profiles (username);

-- 4) Trigger-ul de creare profil setează și username-ul din user_metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'viewer'),
    new.raw_user_meta_data ->> 'username'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
