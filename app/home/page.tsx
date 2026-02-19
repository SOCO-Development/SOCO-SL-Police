'use client';

import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { FileText, LayoutDashboard, Settings, ArrowRight, Shield, BarChart3, Cog, ChevronDown } from 'lucide-react';

const sections = [
  {
    title: 'Complaint Management',
    description: 'Lodge, view, and manage SOCO internal cases across stations and categories.',
    href: '/complaints',
    icon: FileText,
    gradient: 'from-blue-500 to-cyan-500',
    lightBg: 'from-blue-50 to-cyan-50',
    iconBg: 'bg-blue-500/10 text-blue-600',
  },
  {
    title: 'Reports and Dashboards',
    description: 'Analytics, complaint reports, officer stats, and 360° dashboards.',
    href: '/reports',
    icon: LayoutDashboard,
    gradient: 'from-emerald-500 to-teal-500',
    lightBg: 'from-emerald-50 to-teal-50',
    iconBg: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    title: 'Configuration',
    description: 'Manage categories, users, locations, and system settings.',
    href: '/config',
    icon: Settings,
    gradient: 'from-violet-500 to-purple-500',
    lightBg: 'from-violet-50 to-purple-50',
    iconBg: 'bg-violet-500/10 text-violet-600',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />
      <div className="flex flex-1 relative z-10 w-full pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          {/* Hero */}
          <section className="relative overflow-hidden min-h-[420px] sm:min-h-[480px] lg:min-h-[520px] flex items-center">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />
            {/* Animated gradient overlay */}
            <div
              className="absolute inset-0 hero-gradient-shift bg-gradient-to-tr from-blue-600/20 via-transparent to-amber-500/10"
              aria-hidden
            />
            {/* Soft orbs */}
            <div
              className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-blue-500/20 blur-[100px] hero-glow-pulse"
              aria-hidden
            />
            <div
              className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-indigo-500/25 blur-[90px] hero-glow-pulse"
              style={{ animationDelay: '1s' }}
              aria-hidden
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-400/5 blur-[120px]"
              aria-hidden
            />
            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
                backgroundSize: '48px 48px',
              }}
              aria-hidden
            />
            {/* Content */}
            <div className="relative w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
              <div className="max-w-4xl mx-auto text-center">
                {/* Logo + badge row */}
                <div className="hero-float inline-flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mb-8">
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-3 rounded-full bg-white/10 blur-xl" />
                    <Image
                      src="/logo.png"
                      alt="Sri Lanka Police"
                      width={88}
                      height={88}
                      className="relative drop-shadow-2xl object-contain"
                      priority
                    />
                  </div>
                  <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/10 text-blue-100 text-sm font-semibold backdrop-blur-md border border-white/20 shadow-lg shadow-black/10">
                    <Shield className="w-4 h-4 text-amber-300/90" />
                    SOCO Internal System
                  </div>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white tracking-tight mb-3 drop-shadow-lg">
                  Welcome to SOCO
                </h1>
                <p className="text-xl sm:text-2xl lg:text-3xl text-blue-100/95 font-medium max-w-2xl mx-auto mb-2 tracking-tight">
                  Sri Lanka Police
                </p>
                <p className="text-blue-200/90 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
                  Manage internal case workflows, view reports, and configure the system from one place.
                </p>
                {/* Scroll cue */}
                <div className="flex justify-center">
                  <span className="inline-flex flex-col items-center gap-1 text-white/60 text-xs font-medium">
                    <span>Quick access below</span>
                    <ChevronDown className="w-5 h-5 animate-bounce" />
                  </span>
                </div>
              </div>
            </div>
            {/* Bottom fade into page */}
            <div
              className="absolute bottom-0 left-0 right-0 h-24 sm:h-28 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/80 to-transparent"
              aria-hidden
            />
          </section>

          {/* Quick access cards */}
          <section className="w-full px-4 sm:px-6 lg:px-8 -mt-2 pb-16">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-slate-500" />
                Quick access
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sections.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group relative block rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm hover:shadow-xl hover:border-slate-300/80 transition-all duration-300 overflow-hidden"
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${item.lightBg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                      />
                      <div className="relative">
                        <div
                          className={`inline-flex p-3 rounded-xl ${item.iconBg} mb-4 transition-transform duration-300 group-hover:scale-110`}
                        >
                          <Icon className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-slate-900">
                          {item.title}
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed mb-4">
                          {item.description}
                        </p>
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
                          Open
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                      <div
                        className={`absolute bottom-0 right-0 w-24 h-24 rounded-tl-full bg-gradient-to-br ${item.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Footer strip */}
          <section className="mt-auto border-t border-slate-200/80 bg-white/50">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
              <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-slate-600 text-sm">
                  Need help? Visit{' '}
                  <Link href="/config" className="text-blue-600 hover:underline font-medium">
                    Configuration
                  </Link>{' '}
                  for system settings.
                </p>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Cog className="w-4 h-4" />
                  SOCO - SL Police
                </div>
              </div>
            </div>
          </section>
          <Footer />
        </main>
      </div>
    </div>
  );
}
