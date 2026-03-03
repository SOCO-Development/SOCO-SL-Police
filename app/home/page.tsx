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
  Radio,
  Lock,
  Users,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/* ─── Data ─────────────────────────────────────────── */

const sections = [
  {
    title: 'Complaint Management',
    description:
      'Lodge, view, and manage SOCO internal cases across stations and categories with full audit trails.',
    href: '/complaints',
    icon: FileText,
    accentColor: '#2563eb',
    borderColor: 'rgba(37,99,235,0.25)',
    tag: 'Cases & Incidents',
  },
  {
    title: 'Reports & Dashboards',
    description:
      'Analytics, complaint reports, officer stats, and 360° dashboards for command-level oversight.',
    href: '/reports',
    icon: LayoutDashboard,
    accentColor: '#0d9488',
    borderColor: 'rgba(13,148,136,0.25)',
    tag: 'Analytics',
  },
  {
    title: 'Configuration',
    description:
      'Manage categories, users, locations, and all system settings from a single control panel.',
    href: '/config',
    icon: Settings,
    accentColor: '#7c3aed',
    borderColor: 'rgba(124,58,237,0.25)',
    tag: 'System Admin',
  },
];

const stats = [
  { label: 'System Status', value: 'ONLINE', icon: Activity, color: '#16a34a', pulse: true },
  { label: 'Active Officers', value: '—', icon: Users, color: '#60a5fa', pulse: false },
  { label: 'Open Cases', value: '—', icon: AlertCircle, color: '#d97706', pulse: false },
  { label: 'Resolved Today', value: '—', icon: CheckCircle2, color: '#16a34a', pulse: false },
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

      // Background — deep navy, no harsh contrast
      const bg = ctx!.createRadialGradient(cx, cy, 0, cx, cy, R);
      bg.addColorStop(0, 'rgba(22, 40, 72, 0.95)');
      bg.addColorStop(1, 'rgba(10, 22, 46, 0.98)');
      ctx!.fillStyle = bg;
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, Math.PI * 2);
      ctx!.fill();

      // Rings — soft, understated
      for (let i = 1; i <= 4; i++) {
        ctx!.beginPath();
        ctx!.arc(cx, cy, (R * i) / 4, 0, Math.PI * 2);
        ctx!.strokeStyle = 'rgba(148,163,184,0.12)';
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }

      // Cross-hairs
      ctx!.strokeStyle = 'rgba(148,163,184,0.1)';
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(cx - R, cy);
      ctx!.lineTo(cx + R, cy);
      ctx!.moveTo(cx, cy - R);
      ctx!.lineTo(cx, cy + R);
      ctx!.stroke();

      // Sweep — muted blue-green
      const steps = 55;
      for (let s = 0; s < steps; s++) {
        const a0 = angle - (s * Math.PI * 2) / 360;
        const a1 = angle - ((s + 1) * Math.PI * 2) / 360;
        const opacity = Math.max(0, 0.22 - (s / steps) * 0.22);
        ctx!.beginPath();
        ctx!.moveTo(cx, cy);
        ctx!.arc(cx, cy, R, a0, a1, true);
        ctx!.closePath();
        ctx!.fillStyle = `rgba(37,99,235,${opacity})`;
        ctx!.fill();
      }

      // Sweep line — clean white-blue
      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      ctx!.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R);
      ctx!.strokeStyle = 'rgba(147,197,253,0.75)';
      ctx!.lineWidth = 1.5;
      ctx!.stroke();

      // Blips — muted green, no neon
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
          ctx!.fillStyle = `rgba(74,222,128,${fade * 0.85})`;
          ctx!.fill();
          ctx!.beginPath();
          ctx!.arc(bx, by, 5, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(74,222,128,${fade * 0.18})`;
          ctx!.fill();
        }
      });

      // Center dot
      ctx!.beginPath();
      ctx!.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx!.fillStyle = 'rgba(147,197,253,0.8)';
      ctx!.fill();

      // Border
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, Math.PI * 2);
      ctx!.strokeStyle = 'rgba(71,85,105,0.5)';
      ctx!.lineWidth = 1.5;
      ctx!.stroke();

      angle += 0.016;
      animFrame = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animFrame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={240}
      className="radar-canvas"
      aria-hidden
    />
  );
}

/* ─── Stat card ─────────────────────────────────────── */
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  pulse,
}: {
  label: string;
  value: string;
  icon: typeof Activity;
  color: string;
  pulse: boolean;
}) {
  return (
    <div className="hp-stat-card">
      <div className="hp-stat-icon" style={{ '--sc': color } as React.CSSProperties}>
        {pulse && <span className="hp-stat-pulse" style={{ background: color }} />}
        <Icon style={{ width: 16, height: 16, color, position: 'relative', zIndex: 1 }} />
      </div>
      <div>
        <p className="hp-stat-label">{label}</p>
        <p className="hp-stat-value" style={{ color }}>
          {value}
        </p>
      </div>
    </div>
  );
}

/* ─── Section card ───────────────────────────────────── */
function SectionCard({
  title,
  description,
  href,
  icon: Icon,
  accentColor,
  borderColor,
  tag,
  index,
}: (typeof sections)[number] & { index: number }) {
  return (
    <Link
      href={href}
      className="hp-section-card"
      style={
        {
          '--ac': accentColor,
          '--bc': borderColor,
          animationDelay: `${index * 0.1}s`,
        } as React.CSSProperties
      }
    >
      {/* Left accent bar */}
      <div className="hp-card-bar" style={{ background: accentColor }} />

      {/* Tag */}
      <span className="hp-card-tag" style={{ color: accentColor }}>
        {tag}
      </span>

      {/* Icon */}
      <div className="hp-card-icon" style={{ '--ac': accentColor } as React.CSSProperties}>
        <Icon style={{ width: 22, height: 22, color: accentColor }} />
      </div>

      {/* Text */}
      <h3 className="hp-card-title">{title}</h3>
      <p className="hp-card-desc">{description}</p>

      {/* CTA */}
      <div className="hp-card-cta" style={{ color: accentColor }}>
        <span>Open module</span>
        <ArrowRight style={{ width: 15, height: 15 }} className="hp-card-arrow" />
      </div>

      {/* Secured */}
      <div className="hp-card-secured">
        <Lock style={{ width: 10, height: 10 }} />
        <span>Secured</span>
      </div>
    </Link>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

        /* ─── Tokens ─── */
        .hp-root {
          --hp-bg:          #0c1524;
          --hp-surface:     #111e33;
          --hp-surface-2:   #162030;
          --hp-border:      #1e304a;
          --hp-border-2:    #243754;
          --hp-navy:        #162644;
          --hp-text:        #e2e8f0;
          --hp-text-muted:  #7f97b8;
          --hp-text-dim:    #4a6080;
          --hp-blue:        #2563eb;
          --hp-blue-light:  #60a5fa;
          --hp-gold:        #b48a2a;
          --hp-gold-light:  #d4a94a;
          font-family: 'Inter', system-ui, sans-serif;
          background: var(--hp-bg);
          color: var(--hp-text);
          min-height: 100vh;
        }

        /* ─── Hero ─── */
        .hp-hero {
          position: relative;
          min-height: 580px;
          display: flex;
          align-items: center;
          overflow: hidden;
          background: linear-gradient(160deg, #0c1524 0%, #111e33 45%, #0e1a2e 100%);
        }

        /* Subtle grid */
        .hp-hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        /* Soft depth orb — muted, not neon */
        .hp-hero-orb {
          position: absolute;
          top: -60px;
          left: -80px;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(30,64,120,0.22) 0%, transparent 65%);
          pointer-events: none;
        }
        .hp-hero-orb-2 {
          position: absolute;
          bottom: -100px;
          right: -60px;
          width: 340px;
          height: 340px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(20,50,100,0.18) 0%, transparent 65%);
          pointer-events: none;
        }

        /* Thin top accent line */
        .hp-hero-topline {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, #2563eb 30%, #b48a2a 65%, transparent 100%);
          opacity: 0.6;
        }

        .hp-hero-inner {
          position: relative;
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          padding: 80px 40px 96px;
          display: grid;
          grid-template-columns: 1fr 260px;
          gap: 56px;
          align-items: center;
        }
        @media (max-width: 880px) {
          .hp-hero-inner { grid-template-columns: 1fr; padding: 60px 24px 80px; }
          .hp-radar-col { display: none; }
        }

        /* Status badge */
        .hp-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 5px 14px 5px 10px;
          border-radius: 4px;
          background: rgba(22,38,68,0.8);
          border: 1px solid var(--hp-border-2);
          color: var(--hp-text-muted);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 28px;
          width: fit-content;
        }
        .hp-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #16a34a;
          animation: hpDotPulse 2.5s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes hpDotPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* Logo row */
        .hp-logo-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
          padding-bottom: 28px;
          border-bottom: 1px solid var(--hp-border);
        }
        .hp-logo-img {
          flex-shrink: 0;
          border-radius: 50%;
          border: 1px solid var(--hp-border-2);
          padding: 4px;
          background: rgba(22,38,68,0.6);
        }
        .hp-logo-text-primary {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--hp-gold-light);
          line-height: 1.4;
        }
        .hp-logo-text-secondary {
          font-size: 11px;
          color: var(--hp-text-dim);
          letter-spacing: 0.04em;
          margin-top: 2px;
        }

        /* Heading */
        .hp-h1 {
          font-size: clamp(36px, 5.5vw, 62px);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -0.025em;
          color: #f0f6ff;
          margin-bottom: 10px;
        }
        .hp-h1-accent {
          color: var(--hp-gold-light);
        }
        .hp-subtitle {
          font-size: clamp(15px, 2vw, 19px);
          color: var(--hp-blue-light);
          font-weight: 500;
          margin-bottom: 18px;
          letter-spacing: 0.01em;
        }
        .hp-desc {
          font-size: 14px;
          color: var(--hp-text-muted);
          line-height: 1.75;
          max-width: 500px;
          margin-bottom: 36px;
        }

        /* CTA */
        .hp-cta {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 12px 24px;
          border-radius: 6px;
          background: var(--hp-blue);
          color: #fff;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.08);
          transition: background 0.2s ease, transform 0.15s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .hp-cta:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(37,99,235,0.25), inset 0 1px 0 rgba(255,255,255,0.1);
        }

        /* Radar column */
        .hp-radar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .radar-canvas {
          border-radius: 50%;
          border: 1px solid var(--hp-border-2);
          box-shadow: 0 4px 24px rgba(0,0,0,0.4);
        }
        .hp-radar-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--hp-text-dim);
        }

        /* Hero bottom fade */
        .hp-hero-fade {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 80px;
          background: linear-gradient(to bottom, transparent, #0c1524);
          pointer-events: none;
        }

        /* ─── Stats bar ─── */
        .hp-stats-bar {
          background: var(--hp-surface);
          border-top: 1px solid var(--hp-border);
          border-bottom: 1px solid var(--hp-border);
          padding: 0 40px;
        }
        .hp-stats-inner {
          max-width: 1240px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          divide-x: 1px solid var(--hp-border);
        }
        @media (max-width: 720px) {
          .hp-stats-inner { grid-template-columns: repeat(2, 1fr); }
          .hp-stats-bar { padding: 0 20px; }
        }
        .hp-stat-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 20px;
          border-right: 1px solid var(--hp-border);
          transition: background 0.2s;
        }
        .hp-stat-card:last-child { border-right: none; }
        .hp-stat-card:hover { background: rgba(255,255,255,0.02); }
        .hp-stat-icon {
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--hp-border);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .hp-stat-pulse {
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          opacity: 0;
          animation: hpStatPulse 3s ease-in-out infinite;
        }
        @keyframes hpStatPulse {
          0% { opacity: 0.25; transform: scale(0.85); }
          70% { opacity: 0; transform: scale(1.4); }
          100% { opacity: 0; transform: scale(1.4); }
        }
        .hp-stat-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--hp-text-dim);
          margin-bottom: 3px;
        }
        .hp-stat-value {
          font-size: 15px;
          font-weight: 700;
          line-height: 1;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.02em;
        }

        /* ─── Modules section ─── */
        .hp-modules {
          background: var(--hp-bg);
          padding: 56px 40px 72px;
        }
        @media (max-width: 640px) { .hp-modules { padding: 40px 20px 56px; } }

        .hp-modules-header {
          max-width: 1240px;
          margin: 0 auto 36px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--hp-border);
        }
        .hp-modules-h2 {
          font-size: 20px;
          font-weight: 700;
          color: #e2e8f0;
          letter-spacing: -0.01em;
          margin-bottom: 4px;
        }
        .hp-modules-sub {
          font-size: 13px;
          color: var(--hp-text-dim);
        }
        .hp-modules-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--hp-text-dim);
        }

        .hp-grid {
          max-width: 1240px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 900px) {
          .hp-grid { grid-template-columns: 1fr; max-width: 480px; }
        }

        /* Card */
        .hp-section-card {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 28px 24px 24px 28px;
          border-radius: 8px;
          background: var(--hp-surface);
          border: 1px solid var(--hp-border);
          text-decoration: none;
          overflow: hidden;
          transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease;
          animation: hpCardIn 0.45s ease-out both;
        }
        @keyframes hpCardIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hp-section-card:hover {
          border-color: var(--bc, rgba(37,99,235,0.35));
          box-shadow: 0 0 0 1px var(--bc, rgba(37,99,235,0.2)),
                      0 8px 32px rgba(0,0,0,0.35);
          transform: translateY(-3px);
        }

        /* Left accent bar */
        .hp-card-bar {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 3px;
          opacity: 0.7;
          border-radius: 0;
          transition: opacity 0.25s;
        }
        .hp-section-card:hover .hp-card-bar { opacity: 1; }

        /* Tag */
        .hp-card-tag {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 18px;
          display: block;
          opacity: 0.8;
        }

        /* Icon */
        .hp-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--hp-border);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
          transition: background 0.25s, border-color 0.25s;
        }
        .hp-section-card:hover .hp-card-icon {
          background: rgba(255,255,255,0.07);
          border-color: var(--bc, var(--hp-border-2));
        }

        /* Text */
        .hp-card-title {
          font-size: 17px;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 8px;
          letter-spacing: -0.01em;
          line-height: 1.3;
        }
        .hp-card-desc {
          font-size: 13px;
          color: var(--hp-text-muted);
          line-height: 1.7;
          flex: 1;
          margin-bottom: 22px;
        }

        /* CTA */
        .hp-card-cta {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12.5px;
          font-weight: 600;
          transition: gap 0.2s ease;
        }
        .hp-section-card:hover .hp-card-cta { gap: 9px; }
        .hp-card-arrow {
          transition: transform 0.2s ease;
        }
        .hp-section-card:hover .hp-card-arrow { transform: translateX(3px); }

        /* Secured badge */
        .hp-card-secured {
          position: absolute;
          bottom: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--hp-text-dim);
          transition: color 0.2s;
        }
        .hp-section-card:hover .hp-card-secured { color: var(--hp-text-muted); }

        /* ─── Footer strip ─── */
        .hp-foot {
          background: var(--hp-surface);
          border-top: 1px solid var(--hp-border);
          padding: 18px 40px;
        }
        @media (max-width: 640px) { .hp-foot { padding: 16px 20px; } }
        .hp-foot-inner {
          max-width: 1240px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .hp-foot-left {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12.5px;
          color: var(--hp-text-muted);
        }
        .hp-foot-left a {
          color: var(--hp-blue-light);
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }
        .hp-foot-left a:hover { color: #93c5fd; }
        .hp-foot-right {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--hp-text-dim);
          font-family: 'JetBrains Mono', monospace;
        }
        .hp-foot-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #16a34a;
          animation: hpDotPulse 2.5s ease-in-out infinite;
        }
      `}</style>

      <div className="hp-root min-h-screen flex flex-col">
        <Header />

        <div className="flex flex-1 w-full pt-14">
          <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col">

            {/* ── Hero ── */}
            <section className="hp-hero">
              <div className="hp-hero-topline" aria-hidden />
              <div className="hp-hero-grid" aria-hidden />
              <div className="hp-hero-orb" aria-hidden />
              <div className="hp-hero-orb-2" aria-hidden />

              <div className="hp-hero-inner">
                {/* Left */}
                <div>
                  {/* Live badge */}
                  <div className="hp-badge">
                    <span className="hp-badge-dot" />
                    <Radio style={{ width: 11, height: 11 }} />
                    SOCO Command System · Live
                  </div>

                  {/* Logo row */}
                  <div className="hp-logo-row">
                    <Image
                      src="/logo.png"
                      alt="Sri Lanka Police"
                      width={52}
                      height={52}
                      className="hp-logo-img object-contain"
                      priority
                    />
                    <div>
                      <p className="hp-logo-text-primary">Sri Lanka Police</p>
                      <p className="hp-logo-text-secondary">SOCO · Internal Operations Platform</p>
                    </div>
                  </div>

                  {/* Heading */}
                  <h1 className="hp-h1">
                    Command &amp;{' '}
                    <span className="hp-h1-accent">Control</span>
                    <br />
                    Center
                  </h1>
                  <p className="hp-subtitle">Scene of Crime &amp; Operations</p>
                  <p className="hp-desc">
                    A unified digital operations platform for Sri Lanka Police — manage internal
                    case workflows, monitor compliance, and drive data-informed policing across all
                    divisions.
                  </p>

                  <Link href="/complaints" className="hp-cta">
                    <Shield style={{ width: 16, height: 16 }} />
                    Access System
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                </div>

                {/* Radar */}
                <div className="hp-radar-col">
                  {mounted && <RadarCanvas />}
                  <span className="hp-radar-label">[ Tracking Active ]</span>
                </div>
              </div>

              <div className="hp-hero-fade" aria-hidden />
            </section>

            {/* ── Stats bar ── */}
            <div className="hp-stats-bar">
              <div className="hp-stats-inner">
                {stats.map(s => (
                  <StatCard key={s.label} {...s} />
                ))}
              </div>
            </div>

            {/* ── Modules ── */}
            <section className="hp-modules">
              <div className="hp-modules-header">
                <div>
                  <h2 className="hp-modules-h2">Module Access</h2>
                  <p className="hp-modules-sub">Select a module to get started</p>
                </div>
                <div className="hp-modules-meta">
                  <BarChart3 style={{ width: 13, height: 13 }} />
                  3 modules available
                </div>
              </div>

              <div className="hp-grid">
                {sections.map((s, i) => (
                  <SectionCard key={s.href} {...s} index={i} />
                ))}
              </div>
            </section>

            {/* ── Footer strip ── */}
            <div className="hp-foot mt-auto">
              <div className="hp-foot-inner">
                <p className="hp-foot-left">
                  <Lock style={{ width: 12, height: 12 }} />
                  Need help? Visit{' '}
                  <Link href="/config">Configuration</Link>{' '}
                  for system settings.
                </p>
                <div className="hp-foot-right">
                  <span className="hp-foot-dot" />
                  SOCO · SL Police · Secured
                </div>
              </div>
            </div>

            <Footer />
          </main>
        </div>
      </div>
    </>
  );
}
