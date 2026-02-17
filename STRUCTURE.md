# Project File Structure

This document outlines the production-ready, scalable file structure for the CMS - SL Police application.

## Directory Structure

```
client/
├── app/                          # Next.js App Router directory
│   ├── complaints/               # Complaint Management Module
│   │   ├── page.tsx            # Main dashboard (shows all complaint cards)
│   │   ├── lodge/
│   │   │   └── page.tsx        # Lodge Complaint form
│   │   ├── my/
│   │   │   └── page.tsx        # My Complaints list
│   │   ├── assignments/
│   │   │   └── page.tsx        # My Assignments
│   │   ├── lost-phone/
│   │   │   └── page.tsx        # Lost Phone Complaints
│   │   ├── view/
│   │   │   └── page.tsx        # View Complaints (with filters)
│   │   ├── assigned/
│   │   │   └── page.tsx        # Assigned Complaints
│   │   ├── edit/
│   │   │   └── page.tsx        # Edit Complaints
│   │   ├── reactivate/
│   │   │   └── page.tsx        # Re-Activate Complaints
│   │   └── locations/
│   │       └── page.tsx        # Police Locations
│   │
│   ├── reports/                 # Reports and Dashboards Module
│   │   ├── page.tsx            # Main dashboard (shows all report cards)
│   │   ├── dashboard/
│   │   │   └── page.tsx        # 360 - Dashboard
│   │   ├── data/
│   │   │   └── page.tsx        # Report & Data
│   │   ├── officer-stats/
│   │   │   └── page.tsx        # Officer Stats.
│   │   ├── complaint-stats/
│   │   │   └── page.tsx        # Main Complaint Stats.
│   │   ├── forward-count/
│   │   │   └── page.tsx        # Forward count
│   │   ├── complaint-report/
│   │   │   └── page.tsx        # Complaint Report
│   │   └── lost-phone/
│   │       └── page.tsx        # Lost Phone Management
│   │
│   ├── config/                  # Configuration Module
│   │   ├── page.tsx            # Main dashboard (shows all config cards)
│   │   ├── category-type/
│   │   │   └── page.tsx        # Category Type Management
│   │   ├── category-assignment/
│   │   │   └── page.tsx        # Category Assignment
│   │   ├── display-text/
│   │   │   └── page.tsx        # Display Text Management
│   │   ├── after-hour/
│   │   │   └── page.tsx        # After Hour Management
│   │   ├── user/
│   │   │   └── page.tsx        # User Management
│   │   ├── privilege/
│   │   │   └── page.tsx        # Privilege Management
│   │   ├── location/
│   │   │   └── page.tsx        # Location Management
│   │   ├── contact/
│   │   │   └── page.tsx        # Contact Management
│   │   ├── designation/
│   │   │   └── page.tsx        # Designation Management
│   │   └── change-password/
│   │       └── page.tsx        # Change my password
│   │
│   ├── login/
│   │   └── page.tsx            # Multi-language login page (English, Sinhala, Tamil)
│   │
│   ├── logout/
│   │   └── page.tsx            # Logout handler
│   │
│   ├── page.tsx                # Root page (redirects to /complaints)
│   ├── layout.tsx              # Root layout with Noto Sans fonts
│   └── globals.css             # Global styles, animations, and scrollbar hiding
│
├── components/                  # Reusable React components
│   ├── layout/                 # Layout components
│   │   ├── Header.tsx          # Sticky navigation header with blur effect
│   │   ├── Footer.tsx          # Footer component (shows on scroll)
│   │   └── Sidebar.tsx         # Collapsible sidebar with animated icons
│   ├── cards/                  # Card components
│   │   └── FeatureCard.tsx    # Feature card component
│   ├── forms/                  # Form components
│   │   ├── FormInput.tsx      # Text input component
│   │   ├── FormTextarea.tsx   # Textarea component
│   │   └── FormSelect.tsx     # Select dropdown component
│   └── modals/                 # Modal components
│       ├── HistoryModal.tsx    # History/task details modal
│       └── RequestDetailsModal.tsx # Complaint details modal
│
├── contexts/                    # React Context providers
│   └── SidebarContext.tsx      # Sidebar state management (isCollapsed, toggleSidebar)
│
├── types/                       # TypeScript type definitions
│   └── index.ts                # Shared types and interfaces
│
├── lib/                         # Utility functions
│   └── utils.ts                # Helper functions (clsx, tailwind-merge)
│
└── public/                     # Static assets
    └── logo.png                # Application logo (also used as favicon)
```

## Design Principles

### 1. **Modular Structure**
- Each main menu item has its own folder (`/complaints`, `/reports`, `/config`)
- Each sub-feature has its own page file
- Easy to locate and maintain specific features
- Clear separation of concerns

### 2. **Scalability**
- New features can be added by creating new folders/files
- No need to modify existing files when adding new pages
- Context API for global state management
- Reusable components for consistency

### 3. **Production Ready**
- Follows Next.js 16 App Router conventions
- TypeScript for type safety
- Consistent naming conventions
- Proper component organization
- Latest Next.js features (Turbopack, React Compiler)

### 4. **Future Updates**
- Each page is independent and can be updated separately
- Shared components in `/components` folder
- Reusable utilities in `/lib` folder
- Context providers for global state
- Easy to add new features without breaking existing code

## Route Mapping

### Authentication
- `/` → Redirects to `/complaints`
- `/login` → Multi-language login page
- `/logout` → Logout handler (clears auth and redirects to login)

### Complaint Management (`/complaints`)
- `/complaints` → Main dashboard
- `/complaints/lodge` → Lodge Complaint form
- `/complaints/my` → My Complaints
- `/complaints/assignments` → My Assignments
- `/complaints/lost-phone` → Lost Phone Complaints
- `/complaints/view` → View Complaints
- `/complaints/assigned` → Assigned Complaints
- `/complaints/edit` → Edit Complaints
- `/complaints/reactivate` → Re-Activate Complaints
- `/complaints/locations` → Police Locations

### Reports and Dashboards (`/reports`)
- `/reports` → Main dashboard
- `/reports/dashboard` → 360 - Dashboard
- `/reports/data` → Report & Data
- `/reports/officer-stats` → Officer Stats.
- `/reports/complaint-stats` → Main Complaint Stats.
- `/reports/forward-count` → Forward count
- `/reports/complaint-report` → Complaint Report
- `/reports/lost-phone` → Lost Phone Management

### Configuration (`/config`)
- `/config` → Main dashboard
- `/config/category-type` → Category Type Management
- `/config/category-assignment` → Category Assignment
- `/config/display-text` → Display Text Management
- `/config/after-hour` → After Hour Management
- `/config/user` → User Management
- `/config/privilege` → Privilege Management
- `/config/location` → Location Management
- `/config/contact` → Contact Management
- `/config/designation` → Designation Management
- `/config/change-password` → Change my password

## Key Features

### UI/UX Enhancements
- **Sticky Navbar**: Fixed header with blur effect (`backdrop-blur-lg`)
- **Collapsible Sidebar**: Smooth animations with icon pulse/bounce/rotate effects
- **Hidden Scrollbar**: Clean interface with hidden scrollbar
- **Responsive Footer**: Footer appears only when scrolled to bottom
- **Smooth Transitions**: All UI elements have smooth transitions
- **Professional Icons**: Lucide React icons throughout the application

### Multi-language Support
- **Noto Sans Fonts**: Integrated for English, Sinhala, and Tamil
- **Login Page**: Multi-language support with proper font rendering
- **Font Classes**: `.font-noto`, `.font-sinhala`, `.font-tamil`

### State Management
- **SidebarContext**: Global sidebar state management
- **React Hooks**: useState, useEffect for component state
- **Local Storage**: Basic authentication state (development)

## Adding New Pages

To add a new page:

1. Create a new folder in the appropriate module directory
2. Add a `page.tsx` file with the page component
3. Follow the existing page structure pattern
4. Use the `useSidebar` hook for responsive layout
5. Include Header, Sidebar, and Footer components

Example:
```typescript
// app/complaints/new-feature/page.tsx
'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';

export default function NewFeaturePage() {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <Header />
      <div className="flex flex-1 relative z-10 w-full pt-14">
        <Sidebar />
        <main className={`flex-1 overflow-x-hidden min-w-0 transition-all duration-300 ease-in-out flex flex-col min-h-[calc(100vh-3.5rem)] ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">New Feature</h1>
              {/* Content will be added here */}
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
```

## Best Practices

1. **Naming Conventions**
   - Folders: lowercase with hyphens (`category-type`)
   - Files: lowercase with hyphens (`page.tsx`)
   - Components: PascalCase (`FeatureCard.tsx`)
   - Contexts: PascalCase with `Context` suffix (`SidebarContext.tsx`)

2. **Component Organization**
   - Keep components small and focused
   - Reuse shared components from `/components`
   - Use Context API for global state
   - Extract complex logic into custom hooks (future)

3. **Type Safety**
   - Define types in `/types/index.ts`
   - Use TypeScript for all new files
   - Avoid `any` types
   - Use proper interfaces for props

4. **Code Structure**
   - Each page should be self-contained
   - Use consistent layout structure
   - Follow the existing patterns
   - Use `useSidebar` hook for responsive layouts
   - Include proper error handling

5. **Styling**
   - Use Tailwind CSS utility classes
   - Follow the existing color scheme
   - Maintain consistent spacing
   - Use smooth transitions for interactions
   - Ensure responsive design

## Technology Stack

- **Next.js 16.1.1**: Latest stable version with App Router
- **React 19.2.3**: Latest React with React Compiler
- **TypeScript 5**: Type safety
- **Tailwind CSS 4**: Utility-first styling
- **Lucide React**: Modern icon library
- **Noto Sans**: Multi-language font support

## Development Notes

- Sidebar state is managed globally via `SidebarContext`
- All pages use responsive layout with dynamic margin based on sidebar state
- Footer is included in each page component (not in root layout)
- Logo.png is used as both logo and favicon
- Scrollbar is hidden globally for cleaner UI
- Navbar has blur effect for modern appearance
