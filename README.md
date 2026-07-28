# Evidența ședințelor de judecată

Aplicație web pentru introducerea zilnică a ședințelor de judecată (agregat pe
toate judecătoriile) și generarea de rapoarte pe **zi, săptămână, lună,
trimestru, semestru și an**. Rulează pe **GitHub + Vercel**, cu **Supabase**
(Postgres + autentificare) ca bază de date.

## Funcționalități

- **Introducere zilnică** cu calcul automat în timp real (Total, Petrecute,
  Amânate, La sediul judecătoriei).
- **Două categorii**: Teleconferință și Instanța de judecată, fiecare cu
  Prezenți / Examinați în lipsa lor / Amânate.
- **Rapoarte** pe perioade predefinite sau interval personalizat, cu grafice,
  tabel detaliat și **export CSV / Excel / PDF**.
- **Roluri**: administrator, operator (introduce date), vizualizator (doar
  rapoarte). Securitate la nivel de bază de date prin Row-Level Security.
- **Administrare utilizatori** din interfață (creare conturi, atribuire roluri).

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · Supabase · Recharts ·
ExcelJS · jsPDF.

---

## 1. Configurare Supabase

1. Creează un cont și un proiect nou pe [supabase.com](https://supabase.com).
2. În **SQL Editor → New query**, rulează pe rând cele două migrări:
   [`0001_init.sql`](supabase/migrations/0001_init.sql) (tabele, roluri,
   trigger-e, RLS) și apoi
   [`0002_username_login.sql`](supabase/migrations/0002_username_login.sql)
   (autentificare cu nume de utilizator).
3. Mergi la **Project Settings → API** și copiază:
   - **Project URL**
   - cheia **anon public**
   - cheia **service_role** (secretă)

## 2. Variabile de mediu

Copiază `.env.example` în `.env.local` și completează:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

> `SUPABASE_SERVICE_ROLE_KEY` este secretă — se folosește doar pe server
> (gestionarea utilizatorilor). Nu o pune niciodată într-o variabilă
> `NEXT_PUBLIC_*`.

## 3. Primul administrator

1. În Supabase, **Authentication → Users → Add user**: introdu un email + parolă
   și bifează confirmarea automată. Email-ul e folosit doar intern —
   autentificarea în aplicație se face cu **nume de utilizator**.
2. În **SQL Editor**, ridică-l la admin și setează-i un username
   (înlocuiește email-ul; alege username-ul dorit):

   ```sql
   update public.profiles set role = 'admin', username = 'admin'
   where id = (select id from auth.users where email = 'adminul-tau@exemplu.md');
   ```

3. Autentifică-te cu **numele de utilizator** și parola. Ceilalți utilizatori îi
   creezi apoi din aplicație (pagina **Administrare**), direct cu username — fără
   email.

## 4. Rulare locală

```bash
npm install
npm run dev
```

Aplicația pornește pe [http://localhost:3000](http://localhost:3000).

---

## 5. Deploy pe Vercel

1. Urcă acest proiect într-un repo pe **GitHub** (rădăcina repo-ului este chiar
   acest folder).
2. Pe [vercel.com](https://vercel.com): **Add New → Project** și importă repo-ul.
3. La **Environment Variables**, adaugă cele trei variabile de mai sus
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`).
4. **Deploy**. La fiecare `git push` pe branch-ul principal, Vercel
   reconstruiește automat.

> Framework preset: **Next.js** (detectat automat). Nu e nevoie de configurări
> suplimentare.

---

## Model de date

Un singur rând pe zi în `daily_sessions` (agregat național). Cele șase cifre se
introduc manual; totalurile sunt coloane calculate de Postgres:

| Categorie            | Câmpuri introduse                          | Calculate                    |
| -------------------- | ------------------------------------------ | ---------------------------- |
| Teleconferință       | Prezenți, Examinați în lipsa lor, Amânate  | Total, Petrecute             |
| Instanța de judecată | Prezenți, Examinați în lipsa lor, Amânate  | Total, Petrecute             |

Indicatori derivați: `Total = Teleconferință.Total + Instanța.Total`,
`Petrecute = Prezenți + Examinați în lipsa lor`, `La sediul judecătoriei =
Instanța.Total`.

## Structura proiectului

```
src/
  app/
    (app)/            # zona autentificată (panou, introducere, rapoarte, admin)
    auth/signout/     # ieșire din cont
    login/            # autentificare
  components/         # UI, grafice, export
  lib/
    supabase/         # client browser / server / proxy / admin
    calc.ts           # calculul indicatorilor
    periods.ts        # intervale de timp + grupare pentru grafice
    report.ts         # rânduri pentru tabel & export
  proxy.ts            # protejarea rutelor + reîmprospătare sesiune
supabase/migrations/  # schema SQL (RLS incluse)
```

## Note

- Exportul **PDF** normalizează diacriticele la ASCII (fonturile implicite jsPDF
  nu conțin glife românești). CSV și Excel păstrează diacriticele complet.
- În Next.js 16, echivalentul „middleware" se numește **`proxy.ts`**.
