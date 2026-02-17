# CMS - SL Police | Complaints Management System

A professional web application for managing police complaints in Sri Lanka, built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4.

## Features

- **Multi-language Login System**: Professional login page with support for English, Sinhala, and Tamil using Noto Sans fonts
- **Responsive Dashboard**: Comprehensive dashboard with organized sections for:
  - Complaint Management
  - Reports and Dashboards
  - Configuration
- **Collapsible Sidebar**: Animated sidebar with smooth transitions and icon animations
- **Professional Navigation**: Sticky navbar with blur effect and dropdown menus
- **Complaint Management**:
  - Lodge new complaints
  - View and manage complaints
  - Track complaint history
  - Assign complaints to officers
  - Edit and reactivate complaints
  - Lost phone complaint management
- **Reports & Analytics**: Various reporting and statistical dashboards
- **Configuration**: System configuration and management tools
- **Modern UI/UX**: 
  - Hidden scrollbar for cleaner interface
  - Smooth animations and transitions
  - Professional color scheme
  - Responsive design

## Project Structure

```
client/
├── app/                    # Next.js App Router directory
│   ├── login/             # Multi-language login page
│   ├── logout/            # Logout handler
│   ├── complaints/        # Complaint Management Module
│   │   ├── lodge/        # Lodge complaint form
│   │   ├── view/         # View complaints list
│   │   ├── my/           # My complaints
│   │   ├── assigned/     # Assigned complaints
│   │   ├── assignments/   # My assignments
│   │   ├── edit/         # Edit complaints
│   │   ├── reactivate/   # Re-activate complaints
│   │   ├── lost-phone/   # Lost phone complaints
│   │   └── locations/    # Police locations
│   ├── reports/          # Reports and Dashboards Module
│   │   ├── dashboard/    # 360 Dashboard
│   │   ├── data/         # Report & Data
│   │   ├── officer-stats/ # Officer statistics
│   │   ├── complaint-stats/ # Complaint statistics
│   │   ├── forward-count/ # Forward count
│   │   ├── complaint-report/ # Complaint report
│   │   └── lost-phone/   # Lost phone management
│   ├── config/           # Configuration Module
│   │   ├── category-type/ # Category type management
│   │   ├── category-assignment/ # Category assignment
│   │   ├── display-text/ # Display text management
│   │   ├── after-hour/   # After hour management
│   │   ├── user/         # User management
│   │   ├── privilege/    # Privilege management
│   │   ├── location/     # Location management
│   │   ├── contact/      # Contact management
│   │   ├── designation/ # Designation management
│   │   └── change-password/ # Change password
│   ├── layout.tsx        # Root layout with font configuration
│   ├── page.tsx         # Home page (redirects to /complaints)
│   └── globals.css       # Global styles and animations
├── components/            # Reusable React components
│   ├── layout/           # Layout components
│   │   ├── Header.tsx   # Sticky navbar with blur effect
│   │   ├── Footer.tsx   # Footer (shows on scroll)
│   │   └── Sidebar.tsx  # Collapsible sidebar with animations
│   ├── cards/            # Card components
│   │   └── FeatureCard.tsx
│   ├── forms/            # Form components
│   │   ├── FormInput.tsx
│   │   ├── FormTextarea.tsx
│   │   └── FormSelect.tsx
│   └── modals/           # Modal components
│       ├── HistoryModal.tsx
│       └── RequestDetailsModal.tsx
├── contexts/              # React Context providers
│   └── SidebarContext.tsx # Sidebar state management
├── types/                 # TypeScript type definitions
│   └── index.ts
├── lib/                   # Utility functions
│   └── utils.ts
└── public/                # Static assets
    └── logo.png           # Application logo (also used as favicon)
```

## Technologies Used

- **Next.js 16.1.1**: React framework with App Router and Turbopack
- **React 19.2.3**: Latest React with React Compiler support
- **TypeScript 5**: Type-safe JavaScript
- **Tailwind CSS 4**: Utility-first CSS framework
- **Lucide React**: Modern icon library (primary)
- **React Icons**: Additional icon library (legacy support)
- **Noto Sans Fonts**: Multi-language font support (English, Sinhala, Tamil)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Component Overview

### Layout Components

- **Header**: Sticky top navigation bar with blur effect, dropdown menus, and Lucide icons
- **Sidebar**: Collapsible sidebar with animated icons and smooth transitions
- **Footer**: Footer that appears when user scrolls to bottom

### Form Components

- **FormInput**: Reusable text input with label, validation, and character count
- **FormTextarea**: Textarea with character count and validation
- **FormSelect**: Dropdown select with custom styling and improved visibility

### Card Components

- **FeatureCard**: Clickable card for dashboard features with hover effects

### Modal Components

- **HistoryModal**: Displays complaint history and task details
- **RequestDetailsModal**: Shows detailed complaint information

## Pages

### Authentication
- `/` - Home page (redirects to /complaints)
- `/login` - Multi-language login page
- `/logout` - Logout handler

### Complaint Management
- `/complaints` - Main dashboard
- `/complaints/lodge` - Lodge a new complaint
- `/complaints/view` - View and manage complaints
- `/complaints/my` - My complaints
- `/complaints/assigned` - Assigned complaints
- `/complaints/assignments` - My assignments
- `/complaints/edit` - Edit complaints
- `/complaints/reactivate` - Re-activate complaints
- `/complaints/lost-phone` - Lost phone complaints
- `/complaints/locations` - Police locations

### Reports and Dashboards
- `/reports` - Main dashboard
- `/reports/dashboard` - 360 Dashboard
- `/reports/data` - Report & Data
- `/reports/officer-stats` - Officer statistics
- `/reports/complaint-stats` - Complaint statistics
- `/reports/forward-count` - Forward count
- `/reports/complaint-report` - Complaint report
- `/reports/lost-phone` - Lost phone management

### Configuration
- `/config` - Main dashboard
- `/config/category-type` - Category type management
- `/config/category-assignment` - Category assignment
- `/config/display-text` - Display text management
- `/config/after-hour` - After hour management
- `/config/user` - User management
- `/config/privilege` - Privilege management
- `/config/location` - Location management
- `/config/contact` - Contact management
- `/config/designation` - Designation management
- `/config/change-password` - Change password

## Styling

The application uses Tailwind CSS 4 for styling with a professional color scheme:
- **Primary**: Blue (#1e40af, #3b82f6)
- **Background**: Light gradients (blue-50, white, gray-50)
- **Text**: Gray scale (gray-700, gray-900)
- **Accents**: Blue for primary actions, Red for logout/destructive actions

### Key Features
- **Hidden Scrollbar**: Clean interface with hidden scrollbar
- **Blur Effects**: Navbar with backdrop blur for modern look
- **Animations**: Smooth transitions and icon animations
- **Responsive**: Mobile-first responsive design

## Development Credentials

For development purposes:
- **Username**: `admin`
- **Password**: `admin123`

## Future Enhancements

- Connect to backend API
- Implement full authentication and authorization
- Add data persistence
- Enhanced mobile responsiveness
- Replace React Icons with custom PNG icons (optional)
- Add more reporting features
- Implement form validations
- Add API integrations

## Notes

- Icons primarily use Lucide React for modern, consistent design
- React Icons available for legacy support
- Multi-language support via Noto Sans fonts (English, Sinhala, Tamil)
- Sample data is used for demonstration. Connect to actual API endpoints.
- All form validations and API integrations need to be implemented.
- Sidebar state is managed via React Context for global access
