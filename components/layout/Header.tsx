'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Menu,
  UserCog,
  LayoutDashboard,
} from 'lucide-react';

interface HeaderProps {
  userName?: string;
}

const navLinkBase =
  'px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2';
const navLinkDefault = 'text-gray-600 hover:text-blue-700 hover:bg-blue-50/80';
const navLinkActive = 'bg-blue-600 text-white shadow-sm';

function isComplaintsActive(pathname: string) {
  return pathname === '/complaints' || pathname.startsWith('/complaints/');
}
function isReportsActive(pathname: string) {
  return pathname === '/reports' || pathname.startsWith('/reports/');
}
function isConfigActive(pathname: string) {
  return pathname === '/config' || pathname.startsWith('/config/');
}

export default function Header({ userName = 'Sandun' }: HeaderProps) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white/70 backdrop-blur-xl shadow-sm border-b border-gray-200/60 fixed top-0 left-0 right-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3 -ml-2 flex-shrink-0">
            <div className="relative flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Sri Lanka Police Logo"
                width={36}
                height={36}
                className="object-contain drop-shadow-sm"
                loading="eager"
                priority
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800 leading-tight">
                CMS - SL Police
              </h1>
              <p className="text-[10px] text-gray-500 leading-tight">Complaints Management System</p>
            </div>
          </div>

          {/* Centered Navigation */}
          <nav className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2 gap-1">
            <Link
              href="/home"
              className={`${navLinkBase} ${
                pathname === '/home' ? navLinkActive : navLinkDefault
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            <Link
              href="/complaints"
              className={`${navLinkBase} ${
                isComplaintsActive(pathname) ? navLinkActive : navLinkDefault
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Complaint Management</span>
            </Link>

            <Link
              href="/reports"
              className={`${navLinkBase} ${isReportsActive(pathname) ? navLinkActive : navLinkDefault}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Reports and Dashboards</span>
            </Link>

            <Link
              href="/config"
              className={`${navLinkBase} ${
                isConfigActive(pathname) ? navLinkActive : navLinkDefault
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Configuration</span>
            </Link>
          </nav>

          {/* User Menu */}
          <div className="relative flex-shrink-0" ref={userRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-all duration-200 flex items-center space-x-2 font-medium border border-gray-200"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm">Hi | {userName}</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  userMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {userMenuOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-52 bg-white rounded-lg shadow-xl border border-gray-200 py-1.5 z-[100] animate-fade-in overflow-hidden">
                <div className="px-3 py-1.5 border-b border-gray-100 bg-gray-50">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    Account
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-sm mx-1"
                >
                  <User className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-sm mx-1"
                >
                  <UserCog className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                  Settings
                </Link>
                <div className="border-t border-gray-100 my-1" />
                <Link
                  href="/logout"
                  className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors rounded-sm mx-1"
                >
                  <LogOut className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                  Logout
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden text-gray-700 p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
