# SOCO - SL Police

**Scene of Crime Operations (SOCO)** — a web application for Sri Lanka Police to manage crime scene visits, officer records, CVR workflows, reports, and system configuration.

Built with **Next.js 16**, **React 19**, **TypeScript**, and **Tailwind CSS 4**.

---

## Features

| Module | Description |
|--------|-------------|
| **Login** | Branded sign-in with English, Sinhala, and Tamil (Noto Sans) |
| **Home** | Scene of Crime Data Management with live radar visualization |
| **Crime Visit Registry** | Initiate visits, drafts, crime scenes, CVR approvals, court & production updates |
| **Crime Officer Management** | Add and view SOCO officers |
| **Reports & Dashboards** | 360° dashboard, complaint/officer stats, data exports |
| **System Configuration** | Locations, vehicles, users, LOV management |

**UI:** Shared component library (`@/components/ui`), consistent page shell (`PageLayout`), theme tokens in `lib/ui/styles.ts` and `app/globals.css`.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript 5 |
| Icons | Lucide React, Phosphor React, React Icons |
| Charts | Recharts |
| Utilities | `clsx`, `tailwind-merge` |

---

## Project structure

```
├── app/
│   ├── layout.tsx              # Root layout, AuthGuard, PageBackground
│   ├── globals.css             # Theme CSS variables
│   ├── login/                  # Login
│   ├── home/                   # Command & Control Center
│   ├── crime-visit-registry/   # Visits, scenes, CVR workflow
│   ├── crime-officer/          # Officer add / view
│   ├── reports/                # Reports & dashboards
│   └── system-config/          # Admin configuration
├── components/
│   ├── ui/                     # Shared primitives (barrel: @/components/ui)
│   ├── layout/                 # Header, Footer, PageLayout, AppTable, …
│   ├── forms/                  # FormInput, DatePicker, CustomSelect, …
│   ├── buttons/                # Button, FilterPrimaryButton
│   ├── modals/                 # ResultPopup, HistoryModal, …
│   └── cards/                  # FeatureCard
├── lib/
│   ├── ui/styles.ts            # Shared class tokens
│   ├── crimeVisitService.ts    # Client-side visit/scene data (dev)
│   └── …
├── public/                     # Static assets (logo, etc.)
└── scripts/                    # Dev helpers (e.g. dev server LAN bind)
```

---

## Getting started

### Prerequisites

- **Node.js** 18.18+ (20 LTS recommended)
- **npm** 9+ (or yarn/pnpm)

### Install

```bash
npm install
```

### Environment (optional)

Copy the example file and adjust for production metadata URLs:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Public site URL for metadata/favicons (optional) |

### Development

```bash
npm run dev
```

- App: [http://localhost:3000](http://localhost:3000)
- Dev server binds to `0.0.0.0` (see `scripts/dev-with-ip.mjs`) for LAN access.

### Production

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

---

## Development login

Authentication is **client-side only** for development/demo. Replace with a secure backend before production.

| Field | Value |
|-------|--------|
| Username | `admin` |
| Password | `admin123` |

Session is stored in `localStorage` (24-hour expiry). Do not use default credentials in production.

---

## Main routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/login` |
| `/login` | Login |
| `/home` | Command & Control Center |
| **Crime Visit Registry** | |
| `/crime-visit-registry` | Registry hub |
| `/crime-visit-registry/initiate` | Initiate visit |
| `/crime-visit-registry/drafts` | Draft visits |
| `/crime-visit-registry/create-scene` | Create crime scene |
| `/crime-visit-registry/crime-visits` | Visit list / detail |
| `/crime-visit-registry/submitted-crime-scenes` | Submitted scenes |
| `/crime-visit-registry/cvr-update-request` | Request CVR amendments |
| `/crime-visit-registry/pending-cvr-approvals` | Approve/reject CVR changes |
| `/crime-visit-registry/production-analysis` | Production sent to analysis |
| `/crime-visit-registry/update-court-details` | Court details |
| `/crime-visit-registry/edit-crime-scene` | Amend crime scene (query: `?id=`) |
| **Crime Officer** | |
| `/crime-officer` | Officer hub |
| `/crime-officer/add` | Add officer |
| `/crime-officer/view` | View officers |
| **Reports** | |
| `/reports` | Reports hub |
| `/reports/dashboard` | 360° dashboard |
| `/reports/data` | Report & data |
| `/reports/officer-stats` | Officer statistics |
| `/reports/complaint-stats` | Complaint statistics |
| `/reports/complaint-report` | Complaint report |
| `/reports/forward-count` | Forward count |
| `/reports/lost-phone` | Lost phone management |
| **System config** | |
| `/system-config` | Configuration hub |
| `/system-config/location` | Locations |
| `/system-config/vehicle` | Vehicles |
| `/system-config/user` | Users |
| `/system-config/lov-management` | LOV management |

---

## Shared UI components

Import from a single entry point:

```tsx
import {
  PageLayout,
  PageHeader,
  BackLink,
  Button,
  FormInput,
  TabBar,
  ApproveRejectActions,
  ActionChipButton,
} from '@/components/ui';
```

**Layout:** `PageLayout` + `PageHeader` replace duplicated Header/Footer markup.

**Forms:** `FormInput`, `FormSelect`, `DatePicker`, `TimePicker`, `CustomSelect`, `MultiSelect`.

**Actions:** `AddRowButton`, `RemoveRowButton`, `ApproveRejectActions`, `ActionChipButton`, `FileUploadButton`, `ToggleChip`, `PaginationControls`.

Styling tokens live in `lib/ui/styles.ts` (inputs, tabs, action chips, back link).

---

## Styling & branding

- **Palette:** Navy, blue, teal accents (Sri Lanka Police–aligned)
- **CSS variables:** Filters, tables, cards — see `app/globals.css`
- **Home:** Optional dark/light theme with canvas radar
- **Fonts:** Geist (app shell), Noto Sans / Sinhala / Tamil on login

---

## Data & security notes

- Visit and crime-scene data are persisted in the **browser** (`localStorage` via service modules) for prototyping.
- There is **no API backend** in this repository yet; integrate your police systems before go-live.
- **Do not** commit secrets, production credentials, or real PII.
- Replace dev auth and client-only storage before production deployment.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (with LAN IP helper) |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run lint` | ESLint (Next.js config) |

---

## Contributing

This repository is intended for **authorized Sri Lanka Police / contractor developers** only.

1. Create a feature branch from `main` (or your team’s default branch).
2. Follow existing patterns: `@/components/ui`, `PageLayout`, TypeScript strictness.
3. Run `npm run build` and `npm run lint` before opening a pull request.
4. Do not commit `.env.local`, credentials, or real operational data.

For internal process questions, contact your project lead or IT security officer.

---

## License

**Proprietary — Sri Lanka Police.** All rights reserved.

See [LICENSE](LICENSE) for terms. Unauthorized copying, distribution, or use outside authorized police operations is prohibited.

---

## Acknowledgments

- Sri Lanka Police — Scene of Crime Operations programme
- Built for internal command, registry, and reporting workflows
