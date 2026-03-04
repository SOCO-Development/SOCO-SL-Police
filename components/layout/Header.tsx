'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  User,
  LogOut,
  ChevronDown,
  Menu,
  UserCog,
  LayoutDashboard,
  Users,
} from 'lucide-react';

interface HeaderProps {
  userName?: string;
}

const NAV_LINKS = [
  { href: '/home', label: 'Home', icon: Home, isActive: (p: string) => p === '/home' },
  { href: '/crime-visit-registry', label: 'Crime Visit Registry', icon: FileText, isActive: (p: string) => p === '/crime-visit-registry' || p.startsWith('/crime-visit-registry/') },
  { href: '/reports', label: 'Reports', icon: LayoutDashboard, isActive: (p: string) => p === '/reports' || p.startsWith('/reports/') },
  { href: '/config/crime-officer', label: 'Crime Officer Management', icon: Users, isActive: (p: string) => p === '/config' || p.startsWith('/config/') },
] as const;

export default function Header({ userName = 'Sandun' }: HeaderProps) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const isHome = pathname === '/home';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className={`h-14 flex-shrink-0 fixed top-0 left-0 right-0 z-50 transition-colors duration-200 ${
      isHome
        ? 'bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50'
        : 'bg-white/70 backdrop-blur-2xl backdrop-saturate-150 shadow-sm border-b border-gray-200/50'
    }`}>
      <div className="h-full w-full px-4 sm:px-6 lg:px-8">
        <div className="h-full flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/home" className="flex items-center gap-3 flex-shrink-0 min-w-0">
            <Image
              src="/logo.png"
              alt="SL Police"
              width={32}
              height={32}
              className="object-contain flex-shrink-0"
              loading="eager"
              priority
            />
            <div className="hidden sm:block min-w-0">
              <span className={`text-base font-semibold truncate block ${isHome ? 'text-white' : 'text-gray-900'}`}>SOCO CMS</span>
              <span className={`text-[10px] truncate block ${isHome ? 'text-gray-400' : 'text-gray-500'}`}>SL Police</span>
            </div>
          </Link>

          {/* Desktop Nav - fixed width to prevent layout shift */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {NAV_LINKS.map(({ href, label, icon: Icon, isActive }) => {
              const active = isActive(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium
                    min-w-[120px] h-9 transition-colors duration-150
                    ${isHome
                      ? active
                        ? 'bg-blue-500/30 text-blue-200'
                        : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                      : active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: User menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors border ${isHome ? 'border-gray-600 hover:bg-gray-700/50 text-gray-200' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left min-w-0">
                  <span className={`text-sm font-medium block truncate max-w-[100px] ${isHome ? 'text-gray-200' : 'text-gray-700'}`}>{userName}</span>
                </div>
                <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isHome ? 'text-gray-400' : 'text-gray-500'} ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {userMenuOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[100] animate-fade-in">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-900 truncate">{userName}</p>
                    <p className="text-[10px] text-gray-500">Account</p>
                  </div>
                  <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                    <UserCog className="w-4 h-4" />
                    Settings
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                  <Link href="/logout" className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={() => setUserMenuOpen(false)}>
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg ${isHome ? 'text-gray-400 hover:bg-gray-700/50' : 'text-gray-600 hover:bg-gray-100'}`}
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav overlay */}
      {mobileMenuOpen && (
        <div className={`md:hidden absolute top-14 left-0 right-0 border-b shadow-lg animate-fade-in z-40 ${isHome ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
          <nav className="p-4 space-y-1">
            {NAV_LINKS.map(({ href, label, icon: Icon, isActive }) => {
              const active = isActive(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${isHome ? (active ? 'bg-blue-500/30 text-blue-200' : 'text-gray-300 hover:bg-gray-700/50') : (active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50')}`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
