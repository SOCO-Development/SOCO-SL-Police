'use client';

import Link from 'next/link';
import { publicAssetSrc } from '@/lib/publicAsset';
import Header from '@/components/layout/Header';
import {
  FileText,
  LayoutDashboard,
  Settings,
  ArrowRight,
  Shield,
  Activity,
  Users,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/* ─── Data ─────────────────────────────────────────── */

const sections = [
  {
    title: 'Crime Visit Registry',
    description:
      'Create, manage, and track SOCO crime scene visit records across all divisions with complete documentation and history tracking.',
    href: '/crime-visit-registry',
    icon: FileText,
    accent: 'blue',
    tag: 'Cases & Incidents',
  },
  {
    title: 'Reports & Dashboards',
    description:
      'Analytics, complaint reports, officer stats, and 360° dashboards for command-level oversight.',
    href: '/reports',
    icon: LayoutDashboard,
    accent: 'cyan',
    tag: 'Analytics',
  },
  {
    title: 'Crime Officer Management',
    description:
      'Add new SOCO officers and view or manage all registered officers.',
    href: '/config/crime-officer',
    icon: Settings,
    accent: 'amber',
    tag: 'Officers',
  },
];

const stats = [
  { label: 'System Status', value: 'ONLINE', icon: Activity, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10' },
  { label: 'Active Officers', value: '—', icon: Users, colorClass: 'text-blue-400', bgClass: 'bg-blue-400/10' },
  { label: 'Open Cases', value: '—', icon: AlertCircle, colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10' },
  { label: 'Resolved Today', value: '—', icon: CheckCircle2, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10' },
];

const THEME_KEY = 'home_theme';

/* ─── Radar canvas ──────────────────────────────────── */
function RadarCanvas({ light }: { light?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let angle = 0;

    const blips = [
      { r: 0.35, a: 0.8 },
      { r: 0.55, a: 2.1 },
      { r: 0.72, a: 3.5 },
      { r: 0.28, a: 5.0 },
      { r: 0.62, a: 4.2 },
      { r: 0.45, a: 1.3 },
    ];

    function draw() {
      const W = canvas!.width;
      const H = canvas!.height;
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(cx, cy) - 6;

      ctx!.clearRect(0, 0, W, H);

      const bg = ctx!.createRadialGradient(cx, cy, 0, cx, cy, R);
      if (light) {
        bg.addColorStop(0, '#f0f9ff');
        bg.addColorStop(1, '#e0f2fe');
      } else {
        bg.addColorStop(0, '#0f172a');
        bg.addColorStop(1, '#020617');
      }
      ctx!.fillStyle = bg;
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, Math.PI * 2);
      ctx!.fill();

      const ringColor = light ? 'rgba(147, 197, 253, 0.4)' : 'rgba(51, 65, 85, 0.4)';
      for (let i = 1; i <= 4; i++) {
        ctx!.beginPath();
        ctx!.arc(cx, cy, (R * i) / 4, 0, Math.PI * 2);
        ctx!.strokeStyle = ringColor;
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }

      ctx!.strokeStyle = ringColor;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(cx - R, cy);
      ctx!.lineTo(cx + R, cy);
      ctx!.moveTo(cx, cy - R);
      ctx!.lineTo(cx, cy + R);
      ctx!.stroke();

      const sweepColor = light ? '59, 130, 246' : '59, 130, 246';
      const steps = 55;
      for (let s = 0; s < steps; s++) {
        const a0 = angle - (s * Math.PI * 2) / 360;
        const a1 = angle - ((s + 1) * Math.PI * 2) / 360;
        const opacity = Math.max(0, (light ? 0.12 : 0.15) - (s / steps) * (light ? 0.12 : 0.15));
        ctx!.beginPath();
        ctx!.moveTo(cx, cy);
        ctx!.arc(cx, cy, R, a0, a1, true);
        ctx!.closePath();
        ctx!.fillStyle = `rgba(${sweepColor}, ${opacity})`;
        ctx!.fill();
      }

      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      ctx!.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R);
      ctx!.strokeStyle = light ? 'rgba(59, 130, 246, 0.6)' : 'rgba(96, 165, 250, 0.8)';
      ctx!.lineWidth = 1.5;
      ctx!.stroke();

      const blipColor = light ? '16, 185, 129' : '52, 211, 153';
      blips.forEach(b => {
        let diff = angle - b.a;
        while (diff < 0) diff += Math.PI * 2;
        diff = diff % (Math.PI * 2);
        const fade = Math.max(0, 1 - diff / (Math.PI * 1.5));
        if (fade > 0.02) {
          const bx = cx + Math.cos(b.a) * b.r * R;
          const by = cy + Math.sin(b.a) * b.r * R;
          ctx!.beginPath();
          ctx!.arc(bx, by, 2.5, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${blipColor}, ${fade * 0.9})`;
          ctx!.fill();
          ctx!.beginPath();
          ctx!.arc(bx, by, 6, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${blipColor}, ${fade * 0.2})`;
          ctx!.fill();
        }
      });

      ctx!.beginPath();
      ctx!.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx!.fillStyle = light ? 'rgba(59, 130, 246, 1)' : 'rgba(96, 165, 250, 1)';
      ctx!.fill();

      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, Math.PI * 2);
      ctx!.strokeStyle = light ? 'rgba(147, 197, 253, 0.5)' : 'rgba(30, 58, 138, 0.5)';
      ctx!.lineWidth = 2;
      ctx!.stroke();

      angle += 0.012;
      animFrame = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animFrame);
  }, [light]);

  return (
    <div className={`relative flex items-center justify-center p-2 rounded-full border backdrop-blur-sm shadow-2xl transition-colors duration-500 ${
      light
        ? 'border-blue-200/50 bg-blue-50/30 shadow-blue-200/20'
        : 'border-slate-800/50 bg-slate-900/30 shadow-blue-900/10'
    }`}>
      <div className={`absolute inset-0 rounded-full border transition-colors duration-500 ${light ? 'border-blue-300/20' : 'border-blue-500/10'}`} />
      <canvas
        ref={canvasRef}
        width={340}
        height={340}
        className="rounded-full"
        aria-hidden
      />
      <div className={`absolute -top-1 w-[1px] h-3 transition-colors duration-500 ${light ? 'bg-blue-400/40' : 'bg-blue-500/50'}`} />
      <div className={`absolute -bottom-1 w-[1px] h-3 transition-colors duration-500 ${light ? 'bg-blue-400/40' : 'bg-blue-500/50'}`} />
      <div className={`absolute -left-1 h-[1px] w-3 transition-colors duration-500 ${light ? 'bg-blue-400/40' : 'bg-blue-500/50'}`} />
      <div className={`absolute -right-1 h-[1px] w-3 transition-colors duration-500 ${light ? 'bg-blue-400/40' : 'bg-blue-500/50'}`} />
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') setTheme(saved);
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  }

  const d = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col font-sans animate-fade-in transition-colors duration-500 ${
      d
        ? 'bg-[#020617] text-slate-200 selection:bg-blue-500/30 selection:text-blue-100'
        : 'bg-gradient-to-br from-blue-50 via-white to-gray-50 text-gray-800 selection:bg-blue-200 selection:text-blue-900'
    }`}>
      <Header homeTheme={theme} onToggleHomeTheme={toggleTheme} />

      <div className="flex flex-1 w-full pt-14">
        <main className="flex-1 min-w-0 flex flex-col relative overflow-hidden">

          {/* ── Background Effects ── */}
          <div className="absolute inset-0 pointer-events-none transition-opacity duration-500">
            {d ? (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0f172a,transparent_80%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
                <div className="absolute -top-20 left-1/4 w-[40rem] h-[40rem] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-amber-600/5 blur-[120px] rounded-full" />
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e0f2fe_1px,transparent_1px),linear-gradient(to_bottom,#e0f2fe_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />
                <div className="absolute -top-20 left-1/4 w-[40rem] h-[40rem] bg-blue-300/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-teal-300/10 blur-[120px] rounded-full" />
              </>
            )}
          </div>

          {/* ── Hero Section ── */}
          <section className="relative z-10 w-full max-w-[1400px] mx-auto px-6 min-h-[calc(100vh-3.5rem)] flex items-center py-20 lg:py-0">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-16 lg:gap-8 items-center w-full">

              {/* Left Content */}
              <div className="flex flex-col items-start gap-8">

                {/* Live Badge */}
                <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border backdrop-blur-md transition-colors duration-500 ${
                  d
                    ? 'border-emerald-500/20 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                    : 'border-emerald-300/40 bg-emerald-50 shadow-sm'
                }`}>
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <span className={`text-[10px] font-bold tracking-[0.2em] uppercase transition-colors duration-500 ${d ? 'text-emerald-400' : 'text-emerald-600'}`}>System Live</span>
                </div>

                {/* Typography Group */}
                <div className="space-y-6">
                  <div className={`flex items-center gap-4 border-b pb-6 w-max pr-12 transition-colors duration-500 ${d ? 'border-slate-800/80' : 'border-gray-200'}`}>
                    <div className={`p-2 rounded-xl border shadow-inner transition-colors duration-500 ${d ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                      <img
                        src={publicAssetSrc('/logo.png')}
                        alt="Sri Lanka Police"
                        width={48}
                        height={48}
                        className="object-contain drop-shadow-md"
                        fetchPriority="high"
                      />
                    </div>
                    <div className="flex flex-col">
                      <h2 className={`text-sm font-bold tracking-widest uppercase transition-colors duration-500 ${d ? 'text-amber-500' : 'text-amber-600'}`}>Sri Lanka Police</h2>
                      <p className={`text-xs font-medium tracking-wider uppercase mt-0.5 transition-colors duration-500 ${d ? 'text-slate-400' : 'text-gray-500'}`}>Scene of Crime Operations</p>
                    </div>
                  </div>

                  <h1 className={`text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] drop-shadow-sm transition-colors duration-500 ${d ? 'text-white' : 'text-gray-900'}`}>
                    Scene of Crime <br />
                    <span className={`text-transparent bg-clip-text bg-gradient-to-r ${d ? 'from-blue-400 via-blue-500 to-indigo-500' : 'from-blue-600 via-blue-500 to-teal-500'}`}>Across Sri Lanka</span>
                  </h1>

                  <p className={`text-lg max-w-xl leading-relaxed transition-colors duration-500 ${d ? 'text-slate-400' : 'text-gray-500'}`}>
                    A comprehensive digital platform for Scene of Crime Officers (SOCO). Efficiently record crime scene visits, manage case documentation, and streamline forensic data operations across all police divisions.
                  </p>
                </div>

                {/* Primary CTA */}
                <Link
                  href="/crime-visit-registry"
                  className={`inline-flex items-center gap-3 px-8 py-4 font-semibold rounded-xl border transition-colors duration-500 ${
                    d
                      ? 'bg-blue-600/20 text-blue-200 border-blue-500/40 hover:bg-blue-600/30'
                      : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span className="tracking-wide">Access Platform</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Right Radar Component */}
              <div className="hidden lg:flex flex-col items-center justify-center relative">
                <div className="relative">
                  {mounted && <RadarCanvas light={!d} />}
                  <div className={`absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 rounded-tl-lg transition-colors duration-500 ${d ? 'border-slate-700' : 'border-blue-200'}`} />
                  <div className={`absolute -top-4 -right-4 w-8 h-8 border-t-2 border-r-2 rounded-tr-lg transition-colors duration-500 ${d ? 'border-slate-700' : 'border-blue-200'}`} />
                  <div className={`absolute -bottom-4 -left-4 w-8 h-8 border-b-2 border-l-2 rounded-bl-lg transition-colors duration-500 ${d ? 'border-slate-700' : 'border-blue-200'}`} />
                  <div className={`absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 rounded-br-lg transition-colors duration-500 ${d ? 'border-slate-700' : 'border-blue-200'}`} />
                </div>
                <div className="absolute -bottom-16 flex items-center gap-3">
                  <div className={`h-[1px] w-12 bg-gradient-to-r from-transparent transition-colors duration-500 ${d ? 'to-blue-500/50' : 'to-blue-300/50'}`} />
                  <span className={`text-[10px] font-mono tracking-[0.3em] uppercase transition-colors duration-500 ${d ? 'text-blue-400/80 drop-shadow-md' : 'text-blue-500/70'}`}>Tracking Active</span>
                  <div className={`h-[1px] w-12 bg-gradient-to-l from-transparent transition-colors duration-500 ${d ? 'to-blue-500/50' : 'to-blue-300/50'}`} />
                </div>
              </div>

            </div>
          </section>

          {/* ── Stats Bar ── */}
          <section className={`relative z-10 border-y backdrop-blur-xl transition-colors duration-500 ${
            d
              ? 'border-slate-800/80 bg-[#070b14]/80'
              : 'border-gray-200/80 bg-white/60'
          }`}>
            <div className={`max-w-[1400px] mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 divide-x transition-colors duration-500 ${d ? 'divide-slate-800/80' : 'divide-gray-200/80'}`}>
              {stats.map((s, i) => (
                <div key={i} className={`group py-6 lg:py-8 px-4 lg:px-10 flex items-center gap-5 transition-colors ${d ? 'hover:bg-slate-800/20' : 'hover:bg-blue-50/50'}`}>
                  <div className={`p-3.5 rounded-xl ${s.bgClass} border ring-1 ring-inset group-hover:scale-110 transition-transform duration-300 ${d ? 'border-white/5 ring-white/10' : 'border-gray-200/50 ring-gray-200/50'}`}>
                    <s.icon className={`w-6 h-6 ${s.colorClass}`} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors duration-500 ${d ? 'text-slate-500' : 'text-gray-400'}`}>{s.label}</span>
                    <span className={`text-2xl font-mono font-bold transition-colors duration-500 ${d ? 'text-slate-100' : 'text-gray-800'}`}>{s.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Modules Section ── */}
          <section className="relative z-10 w-full max-w-[1400px] mx-auto px-6 py-24 pb-32">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <h2 className={`text-2xl font-bold tracking-tight mb-1 transition-colors duration-500 ${d ? 'text-white' : 'text-gray-900'}`}>Module Access</h2>
                <p className={`text-sm transition-colors duration-500 ${d ? 'text-slate-500' : 'text-gray-500'}`}>Choose a module to begin</p>
              </div>
              <div className={`flex items-center gap-2 text-[10px] font-semibold tracking-widest uppercase transition-colors duration-500 ${d ? 'text-slate-500' : 'text-gray-400'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                3 modules available
              </div>
            </div>

            <div className="space-y-3">
              {sections.map((s, i) => {
                const isBlue = s.accent === 'blue';
                const isCyan = s.accent === 'cyan';

                const accentBg = isBlue ? 'group-hover:bg-blue-500/15' : isCyan ? 'group-hover:bg-cyan-500/15' : 'group-hover:bg-amber-500/15';
                const accentBorder = isBlue ? 'group-hover:border-blue-500/50' : isCyan ? 'group-hover:border-cyan-500/50' : 'group-hover:border-amber-500/50';
                const accentText = isBlue ? 'text-blue-400' : isCyan ? 'text-cyan-400' : 'text-amber-400';
                const accentIcon = isBlue ? 'text-blue-400' : isCyan ? 'text-cyan-400' : 'text-amber-400';

                const lightBg = isBlue ? 'group-hover:bg-blue-50' : isCyan ? 'group-hover:bg-cyan-50' : 'group-hover:bg-amber-50';
                const lightBorder = isBlue ? 'group-hover:border-blue-200' : isCyan ? 'group-hover:border-cyan-200' : 'group-hover:border-amber-200';
                const lightAccent = isBlue ? 'text-blue-600' : isCyan ? 'text-cyan-600' : 'text-amber-600';

                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    className={`group flex items-center gap-5 p-5 rounded-xl border transition-all duration-300 ${
                      d
                        ? `border-slate-800/80 bg-slate-900/30 hover:border-slate-700 ${accentBg} ${accentBorder}`
                        : `border-gray-200 bg-white/70 hover:border-gray-300 hover:shadow-lg ${lightBg} ${lightBorder}`
                    }`}
                  >
                    <div className="flex items-center gap-4 shrink-0">
                      <span className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono text-sm font-bold group-hover:scale-105 transition-transform ${
                        d ? 'bg-slate-800/80 text-slate-500' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border group-hover:border-current/50 transition-colors ${
                        d ? `border-slate-700/80 ${accentIcon}` : `border-gray-200 ${lightAccent}`
                      }`}>
                        <s.icon className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-bold truncate transition-colors duration-500 ${d ? 'text-white' : 'text-gray-900'}`}>{s.title}</h3>
                      <p className={`text-sm mt-0.5 line-clamp-2 transition-colors duration-500 ${d ? 'text-slate-500 group-hover:text-slate-400' : 'text-gray-500 group-hover:text-gray-600'}`}>
                        {s.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className={`text-[10px] font-bold tracking-widest uppercase hidden sm:inline ${d ? accentText : lightAccent}`}>
                        {s.tag}
                      </span>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border group-hover:bg-current/10 transition-colors ${
                        d ? `border-slate-700/80 ${accentText}` : `border-gray-200 ${lightAccent}`
                      }`}>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ── Footer Strip ── */}
          <div className={`mt-auto border-t backdrop-blur-xl py-6 relative z-20 transition-colors duration-500 ${
            d
              ? 'border-slate-800/60 bg-[#070b14]/90'
              : 'border-gray-200/80 bg-white/60'
          }`}>
            <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-center">
              <p className={`text-sm transition-colors duration-500 ${d ? 'text-slate-400' : 'text-gray-500'}`}>
                Powered by <span className={`font-semibold transition-colors duration-500 ${d ? 'text-amber-400/90' : 'text-blue-600'}`}>Sri Lanka Telecom</span> | © {new Date().getFullYear()} Sri Lanka Police
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
