# Ponto Digital BM — Context for AI Coding Agents

## Goal
Complete and deploy a multi-company electronic time clock (Ponto Eletrônico) SaaS system with React/Vite/TypeScript frontend, Supabase Cloud/PostgreSQL backend, LGPD compliance, and premium UI.

## Constraints & Preferences
- Frontend: React, Vite, TypeScript, TailwindCSS, shadcn/ui, Framer Motion, Recharts, Lucide React
- Backend: Supabase Cloud (project `svvbfshcpetazsrgnyac`), PostgreSQL
- Architecture: Multi-tenant (multiempresa), SaaS, brand "Ponto Digital BM"
- Design: Neo Industrial SaaS UI, glassmorphism, dark mode, mobile-first
- Deploy target: Netlify (from `ponto-digital` GitHub repo, branch `main`)
- Auto-deploy: Netlify pulls from main branch automatically on push
- Path alias: `@` → `./src`

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Build for production
- `npm run lint` — Run ESLint
- `Set-Location "C:\src\Projetos\vendas26\ponto-digital"; git add -A; git commit -m "msg"; git push` — Commit & deploy

---

## Current Status

### Done
- Core project scaffolded: Vite + React + TypeScript, TailwindCSS, shadcn/ui, Supabase, React Router, Recharts, jsPDF, Framer Motion, Lucide React
- Complete Supabase SQL migration with 20+ tables, RLS policies, triggers, functions, views
- Full multi-tenant auth system with role-based routing (master, admin, user)
- 20+ pages: all employee, admin, master dashboards, kiosk, fiscal, LGPD, time tracking, reports, settings
- Premium UI: glassmorphism, neon colors, mesh gradients, animated counters, gauge charts
- **Módulo de Férias**: DB migration, FeriasContext, EmployeeFerias, AdminFerias, routes, sidebar
- **Edge Functions**: `create-tenant` and `enviar-notificacao` both deployed to Supabase Cloud
- JWT verification **disabled** on `create-tenant`
- **MasterTenants CRUD**: create/edit/delete/toggle using Edge Function `create-tenant`
- **CompanyLogin**: company list with auto-fill admin credentials + copy button
- **KioskPage**: QR code generation
- **AdminOcorrencias** (`/admin/ocorrencias`): detects 5 anomaly types (falta, atraso, saida_pendente, saida_antecipada, almoco_incompleto), admin can justificar or corrigir
- **Lunch tracking per company**: `usa_almoco` column on `tenants` (default `true`); used by EmployeeDashboard, KioskPage, usePonto, AdminOcorrencias
- **Auth storage**: `sessionStorage` (not localStorage) to avoid cross-tab lock; `try/finally` + 8s safety timeout in init()
- **Logout**: `try/catch` + `localStorage.removeItem("supabase.auth.token")` + `window.location.href = "/"`
- **Branding**: "Ponto Digital BM" throughout; green clock favicon
- **Netlify config**: `netlify.toml`, `public/_redirects`
- Supabase Auth: `mailer_autoconfirm = true`, `site_url = "https://pontoeletronicoDigital.netlify.app"`
- All features committed to GitHub, auto-deployed to Netlify
- Build: `npm run build` — 0 errors (only chunk size warning)

### In Progress / Next Steps
1. Test company creation flow (master → Empresas → Nova Empresa)
2. Test login as newly created admin
3. Test Ocorrências anomaly detection
4. Test logout (Sair) from admin dashboard
5. Verify lunch tracking works when `usa_almoco = false`
6. Enhance AFD/CSV export to include treated occurrences for payroll

---

## Key Context
- **Project dir**: `C:\src\Projetos\vendas26\ponto-digital`
- **GitHub**: `historiasbiblicasapp/ponto-digital` (main)
- **Netlify**: `https://pontoeletronicoDigital.netlify.app`
- **Supabase Cloud**: `https://svvbfshcpetazsrgnyac.supabase.co`
- **Anon key**: hardcoded in `src/integrations/supabase/client.ts`
- **Supabase Access Token**: `sbp_...` (ask developer for current token)
- **Auth storage**: `sessionStorage` (per-tab, session lost on tab close)
- **Edge Functions**: `create-tenant` has JWT verification OFF; `enviar-notificacao` still has it ON
- **Direct fetch()** used instead of `supabase.functions.invoke()` for create-tenant (SDK was hanging)
