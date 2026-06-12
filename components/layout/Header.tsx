'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { publicAssetSrc } from '@/lib/publicAsset';
import { useDropdownBodyScrollLock } from '@/lib/useDropdownBodyScrollLock';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/lib/api';
import { getUsername } from '@/lib/api/authStorage';
import { getErrorMessage, showErrorAlert } from '@/lib/alerts';
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
  AlertTriangle,
  Sun,
  Moon,
  Settings,
} from 'lucide-react';

export interface HeaderProps {
  userName?: string;
  homeTheme?: 'dark' | 'light';
  onToggleHomeTheme?: () => void;
}

const NAV_LINKS = [
  { href: '/home', label: 'Home', icon: Home, isActive: (p: string) => p === '/home' },
  { href: '/crime-visit-registry', label: 'Crime Visit Registry', icon: FileText, isActive: (p: string) => p === '/crime-visit-registry' || p.startsWith('/crime-visit-registry/') },
  { href: '/reports', label: 'Reports', icon: LayoutDashboard, isActive: (p: string) => p === '/reports' || p.startsWith('/reports/') },
  { href: '/crime-officer', label: 'Crime Officer Management', icon: Users, isActive: (p: string) => p === '/crime-officer' || p.startsWith('/crime-officer/') },
  { href: '/system-config', label: 'Configuration', icon: Settings, isActive: (p: string) => p === '/system-config' || p.startsWith('/system-config/') },
] as const;

export default function Header({ userName: userNameProp, homeTheme, onToggleHomeTheme }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [storedUserName, setStoredUserName] = useState(userNameProp ?? 'User');
  const userName = userNameProp ?? storedUserName;
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isHome = pathname === '/home';
  const isDark = isHome && homeTheme !== 'light';

  useDropdownBodyScrollLock(userMenuOpen);
  useDropdownBodyScrollLock(mobileMenuOpen);

  const updateDropdownPos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    updateDropdownPos();
    window.addEventListener('scroll', updateDropdownPos, true);
    window.addEventListener('resize', updateDropdownPos);
    return () => {
      window.removeEventListener('scroll', updateDropdownPos, true);
      window.removeEventListener('resize', updateDropdownPos);
    };
  }, [userMenuOpen, updateDropdownPos]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const username = getUsername();
    if (username) setStoredUserName(username);
  }, []);

  async function handleLogoutConfirm() {
    setIsLoggingOut(true);
    const username = getUsername() ?? '';
    try {
      if (username) await authService.logout(username);
    } catch (err) {
      showErrorAlert('Logout Failed', getErrorMessage(err, 'Could not reach the server.'));
    } finally {
      setShowLogoutConfirm(false);
      setUserMenuOpen(false);
      setIsLoggingOut(false);
      router.replace('/login');
    }
  }

  function toggleMenu() {
    if (!userMenuOpen) updateDropdownPos();
    setUserMenuOpen(!userMenuOpen);
  }

  const dropdownMenu = userMenuOpen && dropdownPos && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={dropdownRef}
          data-scroll-lock-exempt
          className={`${isDark ? 'dropdown-blur-dark' : 'dropdown-blur'} fixed w-52 rounded-xl border py-1.5 z-[99999] animate-fade-in ${
            isDark ? 'border-gray-600/50' : 'border-white/50'
          }`}
          style={{ top: dropdownPos.top, right: dropdownPos.right }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-semibold truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{userName}</p>
              <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>SOCO Officer</p>
            </div>
          </div>

          <div className={`h-px mx-2 mb-1 ${isDark ? 'bg-gray-600/40' : 'bg-gray-200/60'}`} />

          <Link
            href="/profile"
            className={`flex items-center gap-2.5 px-3 py-2.5 mx-1.5 text-sm transition-colors duration-150 rounded-lg ${
              isDark
                ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                : 'text-gray-700 hover:bg-blue-100 hover:text-blue-800'
            }`}
            onClick={() => setUserMenuOpen(false)}
          >
            <User className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            Profile
          </Link>
          <Link
            href="/settings"
            className={`flex items-center gap-2.5 px-3 py-2.5 mx-1.5 text-sm transition-colors duration-150 rounded-lg ${
              isDark
                ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                : 'text-gray-700 hover:bg-blue-100 hover:text-blue-800'
            }`}
            onClick={() => setUserMenuOpen(false)}
          >
            <UserCog className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            Settings
          </Link>

          <div className={`h-px mx-2 my-1 ${isDark ? 'bg-gray-600/40' : 'bg-gray-200/60'}`} />

          <button
            onClick={() => { setUserMenuOpen(false); setShowLogoutConfirm(true); }}
            className={`flex items-center gap-2.5 px-3 py-2.5 mx-1.5 text-sm transition-colors duration-150 rounded-lg w-[calc(100%-12px)] text-left ${
              isDark
                ? 'text-red-400 hover:bg-red-500/15 hover:text-red-300'
                : 'text-red-600 hover:bg-red-50 hover:text-red-700'
            }`}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <header
        className={`h-14 flex-shrink-0 fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        isDark
          ? 'bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50'
          : 'bg-white/70 backdrop-blur-2xl backdrop-saturate-150 shadow-sm border-b border-gray-200/50'
      }`}>
        <div className="h-full w-full px-4 sm:px-6 lg:px-8">
          <div className="h-full flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/home" className="flex items-center gap-3 flex-shrink-0 min-w-0">
              <img
                src={publicAssetSrc('/logo.png')}
                alt="SL Police"
                width={32}
                height={32}
                className="object-contain flex-shrink-0"
                loading="eager"
                fetchPriority="high"
              />
              <div className="hidden sm:block min-w-0">
                <span className={`text-base font-semibold truncate block transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>SOCO - SL Police</span>
                <span className={`text-[10px] truncate block transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>SL Police</span>
              </div>
            </Link>

            {/* Desktop Nav */}
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
                      ${isDark
                        ? active
                          ? 'bg-blue-500/30 text-blue-200'
                          : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                        : active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: Theme toggle + User menu */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Theme toggle — only on home page */}
              {isHome && onToggleHomeTheme && (
                <button
                  onClick={onToggleHomeTheme}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isDark
                      ? 'text-amber-400 hover:bg-gray-700/50 hover:text-amber-300'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  title={isDark ? 'Light mode' : 'Dark mode'}
                >
                  {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                </button>
              )}

              <button
                ref={triggerRef}
                onClick={toggleMenu}
                className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg border transition-all duration-150 ${
                  isDark
                    ? userMenuOpen
                      ? 'bg-gray-700/70 border-gray-500/50 text-gray-200'
                      : 'border-transparent hover:bg-gray-700/50 hover:border-gray-600/50 text-gray-200'
                    : userMenuOpen
                      ? 'bg-blue-50/60 border-blue-200 text-gray-700'
                      : 'border-transparent hover:bg-gray-50 hover:border-gray-200 text-gray-700'
                }`}
              >
                <div className="hidden sm:flex flex-col items-end min-w-0">
                  <span className={`text-sm font-semibold leading-tight truncate max-w-[100px] transition-colors duration-300 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                    {userName}
                  </span>
                  <span className={`text-[10px] leading-tight transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
                    Officer
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${isDark ? 'text-gray-400' : 'text-gray-400'} ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden p-2 rounded-lg ${isDark ? 'text-gray-400 hover:bg-gray-700/50' : 'text-gray-600 hover:bg-gray-100'}`}
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav overlay */}
        {mobileMenuOpen && (
          <div
            data-scroll-lock-exempt
            className={`md:hidden absolute top-14 left-0 right-0 border-b shadow-lg animate-fade-in z-40 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
          >
            <nav className="p-4 space-y-1">
              {NAV_LINKS.map(({ href, label, icon: Icon, isActive }) => {
                const active = isActive(pathname);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${isDark ? (active ? 'bg-blue-500/30 text-blue-200' : 'text-gray-300 hover:bg-gray-700/50') : (active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100')}`}
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

      {/* Portal-rendered dropdown (outside header's backdrop-filter context) */}
      {dropdownMenu}

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div
            className={`absolute inset-0 bg-black/25 backdrop-blur-sm transition-opacity duration-300 ${isLoggingOut ? 'opacity-100' : ''}`}
            onClick={isLoggingOut ? undefined : () => setShowLogoutConfirm(false)}
          />
          <div className={`relative bg-gradient-to-br from-blue-50 via-white to-gray-50 rounded-xl border border-gray-100 shadow-sm hover:shadow-2xl w-full max-w-sm p-6 transition-all duration-300 ease-out ${isLoggingOut ? 'scale-[0.98] opacity-95' : 'animate-fade-in'}`}>
            <div className="flex flex-col items-center text-center gap-4">
              {isLoggingOut ? (
                <>
                  <div className="p-4 rounded-2xl bg-blue-50/80">
                    <div className="animate-spin w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">Logging out...</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Taking you to the login screen.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-teal-50">
                    <LogOut className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">Sign out of SOCO - SL Police?</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      You will be returned to the login screen.
                    </p>
                  </div>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-150"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLogoutConfirm}
                      className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg border border-red-600 hover:border-red-700 transition-all duration-150"
                    >
                      Yes, Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
