-- ============================================================================
--  Jurnal de audit — cine, ce și când
--  Rulează în Supabase → SQL Editor, o singură dată, după migrările anterioare.
-- ============================================================================

create table public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  actor_id      uuid references auth.users (id) on delete set null,
  actor_username text,          -- denormalizat, supraviețuiește ștergerii userului
  action        text not null,  -- ex: 'session.create', 'user.delete', 'user.role_change'
  entity        text not null,  -- 'session' | 'user'
  entity_label  text,           -- data ședinței sau username-ul vizat
  details       jsonb           -- extra (valori, rol nou etc.)
);

create index audit_log_created_at_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;

-- Doar administratorii citesc jurnalul.
create policy "audit_read_admin" on public.audit_log
  for select using (public.auth_role() = 'admin');

-- Inserările se fac exclusiv server-side, cu cheia service_role (bypass RLS),
-- deci nu se acordă privilegiu de insert rolului 'authenticated'.
grant select on public.audit_log to authenticated;
