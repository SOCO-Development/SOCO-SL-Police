'use client';

import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  FileText,
  LayoutDashboard,
  Settings,
  ArrowRight,
  Shield,
  BarChart3,
  Activity,
  Lock,
  Users,
  AlertCircle,
  CheckCircle2,
  ChevronRight
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

/* ─── Radar canvas ──────────────────────────────────── */
function RadarCanvas() {
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

      // Background gradient
      const bg = ctx!.createRadialGradient(cx, cy, 0, cx, cy, R);
      bg.addColorStop(0, '#0f172a'); // slate-900
      bg.addColorStop(1, '#020617'); // slate-950
      ctx!.fillStyle = bg;
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, Math.PI * 2);
      ctx!.fill();

      // Rings
      for (let i = 1; i <= 4; i++) {
        ctx!.beginPath();
        ctx!.arc(cx, cy, (R * i) / 4, 0, Math.PI * 2);
        ctx!.strokeStyle = 'rgba(51, 65, 85, 0.4)'; // slate-700
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }

      // Cross-hairs
      ctx!.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(cx - R, cy);
      ctx!.lineTo(cx + R, cy);
      ctx!.moveTo(cx, cy - R);
      ctx!.lineTo(cx, cy + R);
      ctx!.stroke();

      // Sweep
      const steps = 55;
      for (let s = 0; s < steps; s++) {
        const a0 = angle - (s * Math.PI * 2) / 360;
        const a1 = angle - ((s + 1) * Math.PI * 2) / 360;
        const opacity = Math.max(0, 0.15 - (s / steps) * 0.15);
        ctx!.beginPath();
        ctx!.moveTo(cx, cy);
        ctx!.arc(cx, cy, R, a0, a1, true);
        ctx!.closePath();
        ctx!.fillStyle = `rgba(59, 130, 246, ${opacity})`; // blue-500
        ctx!.fill();
      }

      // Sweep line
      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      ctx!.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R);
      ctx!.strokeStyle = 'rgba(96, 165, 250, 0.8)'; // blue-400
      ctx!.lineWidth = 1.5;
      ctx!.stroke();

      // Blips
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
          ctx!.fillStyle = `rgba(52, 211, 153, ${fade * 0.9})`; // emerald-400
          ctx!.fill();
          
          ctx!.beginPath();
          ctx!.arc(bx, by, 6, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(52, 211, 153, ${fade * 0.2})`;
          ctx!.fill();
        }
      });

      // Center dot
      ctx!.beginPath();
      ctx!.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx!.fillStyle = 'rgba(96, 165, 250, 1)';
      ctx!.fill();

      // Outer Border
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, Math.PI * 2);
      ctx!.strokeStyle = 'rgba(30, 58, 138, 0.5)'; // blue-900
      ctx!.lineWidth = 2;
      ctx!.stroke();

      angle += 0.012; // slightly slower for a more pro feel
      animFrame = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animFrame);
  }, []);

  return (
    <div className="relative flex items-center justify-center p-2 rounded-full border border-slate-800/50 bg-slate-900/30 backdrop-blur-sm shadow-2xl shadow-blue-900/10">
      <div className="absolute inset-0 rounded-full border border-blue-500/10" />
      <canvas
        ref={canvasRef}
        width={340}
        height={340}
        className="rounded-full"
        aria-hidden
      />
      {/* Outer framing target markers */}
      <div className="absolute -top-1 w-[1px] h-3 bg-blue-500/50" />
      <div className="absolute -bottom-1 w-[1px] h-3 bg-blue-500/50" />
      <div className="absolute -left-1 h-[1px] w-3 bg-blue-500/50" />
      <div className="absolute -right-1 h-[1px] w-3 bg-blue-500/50" />
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-100">
      <Header />

      <div className="flex flex-1 w-full pt-14">
        <main className="flex-1 min-w-0 flex flex-col relative overflow-hidden">

          {/* ── Background Effects ── */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Dark gradient base */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0f172a,transparent_80%)]" />
            
            {/* Enterprise Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
            
            {/* Glow Orbs */}
            <div className="absolute -top-20 left-1/4 w-[40rem] h-[40rem] bg-blue-600/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-amber-600/5 blur-[120px] rounded-full" />
            
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
          </div>

          {/* ── Hero Section ── */}
          <section className="relative z-10 w-full max-w-[1400px] mx-auto px-6 min-h-[calc(100vh-3.5rem)] flex items-center py-20 lg:py-0">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-16 lg:gap-8 items-center w-full">
              
              {/* Left Content */}
              <div className="flex flex-col items-start gap-8">
                
                {/* Live Badge */}
                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-400 uppercase">System Live</span>
                </div>

                {/* Typography Group */}
                <div className="space-y-6">
                  {/* Agency Header */}
                  <div className="flex items-center gap-4 border-b border-slate-800/80 pb-6 w-max pr-12">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 shadow-inner">
                      <Image
                        src="/logo.png"
                        alt="Sri Lanka Police"
                        width={48}
                        height={48}
                        className="object-contain drop-shadow-md"
                        priority
                      />
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-sm font-bold tracking-widest text-amber-500 uppercase">Sri Lanka Police</h2>
                      <p className="text-xs font-medium text-slate-400 tracking-wider uppercase mt-0.5">Scene of Crime Operations</p>
                    </div>
                  </div>

                  <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] drop-shadow-sm">
                    Command <span className="text-slate-600 font-light">&</span> <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500">Control</span> Center
                  </h1>
                  
                  <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                    A unified digital operations platform. Manage internal case workflows, monitor compliance, and drive data-informed policing across all divisions.
                  </p>
                </div>

                {/* Primary CTA */}
                <Link 
                  href="/complaints" 
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl overflow-hidden transition-all duration-300 shadow-[0_0_40px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.6)] border border-blue-500/50 hover:border-blue-400"
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat transition-[background-position_0s_ease] hover:bg-[position:200%_0,0_0] hover:duration-[1500ms]" />
                  <Shield className="w-5 h-5 relative z-10" />
                  <span className="relative z-10 tracking-wide">Access Platform</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                </Link>

              </div>

              {/* Right Radar Component */}
              <div className="hidden lg:flex flex-col items-center justify-center relative">
                <div className="relative">
                  {mounted && <RadarCanvas />}
                  
                  {/* Radar framing corners */}
                  <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-slate-700 rounded-tl-lg" />
                  <div className="absolute -top-4 -right-4 w-8 h-8 border-t-2 border-r-2 border-slate-700 rounded-tr-lg" />
                  <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b-2 border-l-2 border-slate-700 rounded-bl-lg" />
                  <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-slate-700 rounded-br-lg" />
                </div>
                
                <div className="absolute -bottom-16 flex items-center gap-3">
                  <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-blue-500/50" />
                  <span className="text-[10px] font-mono tracking-[0.3em] text-blue-400/80 uppercase shadow-blue-500/20 drop-shadow-md">Tracking Active</span>
                  <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-blue-500/50" />
                </div>
              </div>

            </div>
          </section>

          {/* ── Stats Bar ── */}
          <section className="relative z-10 border-y border-slate-800/80 bg-[#070b14]/80 backdrop-blur-xl">
            <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-800/80">
              {stats.map((s, i) => (
                <div key={i} className="group py-6 lg:py-8 px-4 lg:px-10 flex items-center gap-5 hover:bg-slate-800/20 transition-colors">
                  <div className={`p-3.5 rounded-xl ${s.bgClass} border border-white/5 ring-1 ring-inset ring-white/10 group-hover:scale-110 transition-transform duration-300`}>
                    <s.icon className={`w-6 h-6 ${s.colorClass}`} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">{s.label}</span>
                    <span className="text-2xl font-mono font-bold text-slate-100">{s.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Modules Section ── */}
          <section className="relative z-10 w-full max-w-[1400px] mx-auto px-6 py-24 pb-32">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-slate-800/80 pb-6">
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Module Access</h2>
                <p className="text-slate-400">Select a secure operations module to proceed.</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 uppercase px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                3 Modules Online
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sections.map((s, i) => {
                const isBlue = s.accent === 'blue';
                const isCyan = s.accent === 'cyan';
                
                // Styles mappings
                const iconBg = isBlue ? 'bg-blue-500/10 text-blue-400' : isCyan ? 'bg-cyan-500/10 text-cyan-400' : 'bg-amber-500/10 text-amber-400';
                const hoverBorder = isBlue ? 'group-hover:border-blue-500/40' : isCyan ? 'group-hover:border-cyan-500/40' : 'group-hover:border-amber-500/40';
                const glowColor = isBlue ? 'from-blue-500/10' : isCyan ? 'from-cyan-500/10' : 'from-amber-500/10';
                const textColor = isBlue ? 'text-blue-400' : isCyan ? 'text-cyan-400' : 'text-amber-400';
                const accentLine = isBlue ? 'bg-blue-500' : isCyan ? 'bg-cyan-500' : 'bg-amber-500';

                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    className={`group relative flex flex-col p-8 rounded-2xl bg-slate-900/40 border border-slate-800 transition-all duration-300 hover:bg-slate-800/60 hover:-translate-y-1 hover:shadow-2xl ${hoverBorder} overflow-hidden backdrop-blur-sm`}
                  >
                    {/* Top Accent Line */}
                    <div className={`absolute top-0 left-0 right-0 h-[2px] ${accentLine} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    
                    {/* Hover Glow */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${glowColor} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
                    
                    {/* Tag */}
                    <div className="flex items-center justify-between mb-8 relative z-10">
                      <span className={`text-[10px] font-bold tracking-widest uppercase ${textColor}`}>
                        {s.tag}
                      </span>
                      <Lock className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </div>

                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 relative z-10 border border-white/5 ring-1 ring-inset ring-white/10 ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
                      <s.icon className="w-7 h-7" />
                    </div>

                    {/* Text */}
                    <h3 className="text-xl font-bold text-white mb-3 relative z-10 tracking-tight group-hover:text-white transition-colors">{s.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-8 flex-1 relative z-10 group-hover:text-slate-300 transition-colors">
                      {s.description}
                    </p>

                    {/* Bottom CTA */}
                    <div className={`flex items-center gap-2 text-sm font-semibold relative z-10 transition-colors ${textColor}`}>
                      Launch Module
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ── Footer Strip ── */}
          <div className="mt-auto border-t border-slate-800/60 bg-[#070b14]/90 backdrop-blur-xl py-6 relative z-20">
            <div className="max-w-[1400px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Lock className="w-4 h-4" />
                <span>
                  Need help? Visit <Link href="/config/crime-officer" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Crime Officer Management</Link> for settings.
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                SOCO · SL Police · Secured
              </div>
            </div>
          </div>

          <Footer />
        </main>
      </div>
    </div>
  );
}
