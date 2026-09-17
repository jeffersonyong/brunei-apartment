# Palm Villa

Booking and operations platform for Palm Villa, Brunei — one Next.js app serving three surfaces
over one database: a public booking site, a staff operations portal, and mobile field screens.

`docs/` is the source of truth. Read [CLAUDE.md](CLAUDE.md) for the documentation map before
building anything; [docs/architecture.md](docs/architecture.md) is normative for engineering
decisions and [docs/design.md](docs/design.md) for the token set.

## Status

**Live.** The public site is at [bruneiapartment.com](https://bruneiapartment.com) and the staff
side at [portal.bruneiapartment.com](https://portal.bruneiapartment.com), on the client's Supabase
and Vercel accounts. Booking, pricing, payments, deposits, the field screens and the admin
settings are all built; what remains before launch is in
[docs/open-questions.md](docs/open-questions.md) and architecture.md §13 — chiefly error
monitoring, a tested restore, and the property's own figures typed in.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the Supabase values
npm run db:start             # local Supabase stack (Docker)
npm run db:reset             # apply migrations + seed
npm run db:bootstrap-admin   # create the first Admin (set BOOTSTRAP_ADMIN_* in .env.local first)
npm run dev
```

The app runs at http://localhost:3000, where one host serves everything. **In production it is two
hosts, one application** (architecture.md §3): the site on `bruneiapartment.com`, the staff side on
`portal.bruneiapartment.com`, with `SITE_ORIGIN` and `STAFF_ORIGIN` telling `proxy.ts` which is
which. Staff paths carry no `/portal` prefix — the portal home is `/dashboard`.

The staff side needs a sign-in at `/login`; the bootstrap script creates the first Admin, and every
further account comes from **Settings → Roles & staff**. An account is created with a temporary
password, and where `RESEND_API_KEY` is set staff can also reset their own by email.

`npm run db:seed-demo` fills a local database with demonstration bookings and creates one demo
account per role (`security@`, `housekeeping@`, `frontoffice@`, `finance@demo.palmvilla.test`),
using `DEMO_STAFF_PASSWORD`.

| Route | Surface |
| --- | --- |
| `/` | Public booking site |
| `/stay`, `/day-pass`, `/faq`, `/find-booking` | The booking flows and their pages |
| `/booking/{token}` | A customer's own booking — payment, documents, entry QR code |
| `/tokens` | Token proof sheet, development only — 404 in production |
| `/dashboard`, `/bookings`, `/payments`, `/deposits`, `/reports`, `/units`, `/settings` | Operations portal (desktop) |
| `/field` | Field screens (mobile web) |
| `/c/{token}` | The entry code a guard scans at the gate |

## Scripts

| Script | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (`lint:fix` to autofix) |
| `npm run format` | Prettier write (`format:check` to verify) |
| `npm run test` | Vitest — unit + integration (needs the local stack up; **resets local data**) |
| `npm run test:unit` | The fast pure-function subset |
| `npm run db:start` / `db:stop` | Local Supabase stack |
| `npm run db:reset` | Apply every migration, then the seed |
| `npm run db:seed-demo` | Demonstration bookings, their accounting packs, and a demo login per role |
| `npm run db:demo-staff` | The demo logins alone (local stack only) |
| `npm run db:bootstrap-admin` | Create the first Admin from `BOOTSTRAP_ADMIN_*` env vars |
| `npm run db:push:hosted` | Push merged migrations to the hosted database (`.env.hosted.local`) |

## Layout

```
app/
  (public)/   # customer-facing — full expressive range of the design system
  (portal)/   # staff desktop — the quiet subset, never above display-sm
  (field)/    # mobile web — single column, ≥48px touch targets
  (auth)/     # sign-in and password recovery
  (entry)/    # /c/{token} — the entry QR code's page
  (print)/    # printable statements
  globals.css # design.md tokens as Tailwind theme + shadcn semantic layer
components/ui/# shadcn/ui primitives, re-skinned to the tokens
lib/
  auth/       # permissions, requirePermission, which host serves what
  db/         # every read and write; server-side only
  domain/     # pure functions — pricing, the booking state machine, projections
  env.ts      # env access, validated at the boundary
  supabase/   # server client (all data access) and browser client (auth only)
proxy.ts      # the two-host split and session refresh
supabase/migrations/  # schema, applied via the CLI
```

## Theming

Light and dark are two role mappings over one fixed palette
([docs/design.md](docs/design.md) §Dark theme). The mechanism is `color-scheme` plus CSS
`light-dark()`, so the OS preference works with no JavaScript; the in-app control flips
`data-theme` on `<html>` to override it. No theming dependency.

Application code should use **roles**, not raw palette tokens:

| Use | Not |
| --- | --- |
| `bg-background` `bg-card` `bg-muted` | `bg-canvas-soft` `bg-canvas` |
| `text-foreground` `text-copy` `text-muted-foreground` | `text-ink` `text-body` `text-mute` |
| `border-border` (hairline) `border-divider` (table rule) | `border-ink` `border-canvas-soft` |

A raw token is correct only where the value must *not* respond to the theme — the swatch grids on
`/tokens` are the one such place.

Two rules carried from `architecture.md`:

- **All database access is server-side.** `lib/supabase/client.ts` exists for auth session handling
  only; anything that queries a table from the browser is a bug.
- **Nothing hardcodes a hex, type size or radius.** `app/globals.css` is the single transcription of
  `design.md`; everything else uses the generated utilities.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · shadcn/ui · Supabase
(`ap-southeast-1`) · Resend · `qrcode` · `pdf-lib` · TipTap · TypeScript · deployed on Vercel.
