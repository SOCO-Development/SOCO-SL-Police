# SOCO - SL Police | Scene of Crime Operations

A professional web application for Sri Lanka Police Scene of Crime Operations (SOCO), built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4.

## Features

- **Multi-language Login**: Login page with support for English, Sinhala, and Tamil using Noto Sans fonts
- **Command & Control Center**: Full-screen hero dashboard with live radar visualization
- **Crime Visit Registry**: Initiate, manage drafts, and view all crime visits
- **Crime Officer Management**: Add SOCO officers and view/manage registered officers
- **Reports & Dashboards**: Analytics, complaint stats, officer stats, and 360° dashboards
- **Configuration**: Categories, users, locations, designations, and system settings
- **Modern UI**: Glassmorphism, Tailwind CSS 4, responsive design, smooth animations

## Project Structure

```
├── app/
│   ├── page.tsx              # Root (redirects to /login)
│   ├── login/                # Multi-language login
│   ├── logout/               # Logout handler
│   ├── home/                 # Command & Control Center dashboard
│   ├── crime-visit-registry/  # Crime Visit Registry module
│   │   ├── page.tsx          # Hub (initiate, drafts, all)
│   │   ├── initiate/         # Initiate new crime visit
│   │   ├── drafts/           # Draft visits
│   │   ├── drafts/[id]/       # Edit draft
│   │   ├── all/              # All visits list
│   │   └── all/[id]/         # View visit details
│   ├── config/               # Configuration module
│   │   ├── crime-officer/    # Crime Officer Management
│   │   │   ├── add/          # Add officer
│   │   │   └── view/         # View officers
│   │   ├── category-type/
│   │   ├── category-assignment/
│   │   ├── user/
│   │   ├── privilege/
│   │   ├── location/
│   │   ├── contact/
│   │   ├── designation/
│   │   └── ...
│   ├── reports/              # Reports & Dashboards
│   │   ├── dashboard/
│   │   ├── data/
│   │   ├── officer-stats/
│   │   ├── complaint-stats/
│   │   └── ...
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── layout/               # Header, Footer, Sidebar
│   ├── forms/                # CrimeVisitForm, DatePicker, TimePicker, CustomSelect
│   └── cards/                # FeatureCard
└── public/
    └── logo.png
```

## Technologies

- **Next.js 16.1.1** – App Router, Turbopack
- **React 19.2.3** – Latest React
- **TypeScript 5** – Type safety
- **Tailwind CSS 4** – Utility-first styling
- **Lucide React** – Icons
- **Recharts** – Charts and dashboards
- **Noto Sans** – Multi-language fonts (English, Sinhala, Tamil)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app listens on all interfaces (`0.0.0.0`) for network access.

### Production Build

```bash
npm run build
npm start
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/login` |
| `/login` | Login page |
| `/home` | Command & Control Center dashboard |
| `/crime-visit-registry` | Crime Visit Registry hub |
| `/crime-visit-registry/initiate` | Initiate new crime visit |
| `/crime-visit-registry/drafts` | Draft visits |
| `/crime-visit-registry/all` | All crime visits |
| `/config/crime-officer` | Crime Officer Management hub |
| `/config/crime-officer/add` | Add SOCO officer |
| `/config/crime-officer/view` | View officers |
| `/reports` | Reports hub |
| `/reports/dashboard` | 360° Dashboard |

## Styling

- **Theme**: Sri Lanka Police palette (navy, gold, slate)
- **Home**: Dark theme, glassmorphism, full-screen hero, radar canvas
- **Forms**: Custom DatePicker, TimePicker, CustomSelect
- **Layout**: Blur navbar, collapsible sidebar, responsive design

## Development Credentials

- **Username**: `admin`
- **Password**: `admin123`

## License

Private – Sri Lanka Police
