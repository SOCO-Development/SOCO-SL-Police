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
    accentColor: '#3b82f6',
    gradientFrom: '#1d4ed8',
    gradientTo: '#0ea5e9',
    tag: 'Cases & Incidents',
  },
  {
    title: 'Reports & Dashboards',
    description:
      'Analytics, complaint reports, officer stats, and 360° dashboards for command-level oversight.',
    href: '/reports',
    icon: LayoutDashboard,
    accentColor: '#10b981',
    gradientFrom: '#059669',
    gradientTo: '#0d9488',
    tag: 'Analytics',
  },
  {
    title: 'Configuration',
    description:
      'Manage categories, users, locations, and all system settings from a single control panel.',
    href: '/config',
    icon: Settings,
    accentColor: '#8b5cf6',
    gradientFrom: '#7c3aed',
    gradientTo: '#a855f7',
    tag: 'System Admin',
  },
];

const stats = [
  { label: 'System Status', value: 'ONLINE', icon: Activity, color: '#10b981', pulse: true },
  { label: 'Active Officers', value: '—', icon: Users, color: '#3b82f6', pulse: false },
  { label: 'Open Cases', value: '—', icon: AlertCircle, color: '#f59e0b', pulse: false },
  { label: 'Resolved Today', value: '—', icon: CheckCircle2, color: '#10b981', pulse: false },
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

    // Blips: fixed positions
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
      const R = Math.min(cx, cy) - 4;

      ctx!.clearRect(0, 0, W, H);

      // Background
      const bg = ctx!.createRadialGradient(cx, cy, 0, cx, cy, R);
      bg.addColorStop(0, 'rgba(15,35,70,0.85)');
      bg.addColorStop(1, 'rgba(5,15,35,0.95)');
      ctx!.fillStyle = bg;
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, Math.PI * 2);
      ctx!.fill();

      // Rings
      for (let i = 1; i <= 4; i++) {
        ctx!.beginPath();
        ctx!.arc(cx, cy, (R * i) / 4, 0, Math.PI * 2);
        ctx!.strokeStyle = 'rgba(59,130,246,0.2)';
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }

      // Cross-hairs
      ctx!.strokeStyle = 'rgba(59,130,246,0.15)';
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(cx - R, cy);
      ctx!.lineTo(cx + R, cy);
      ctx!.moveTo(cx, cy - R);
      ctx!.lineTo(cx, cy + R);
      ctx!.stroke();

      // Sweep gradient
      const sweep = ctx!.createConicalGradient
        ? null // not standard; use manual approach below
        : null;

      // Manual sweep arc
      const steps = 60;
      for (let s = 0; s < steps; s++) {
        const a0 = angle - (s * Math.PI * 2) / 360;
        const a1 = angle - ((s + 1) * Math.PI * 2) / 360;
        const opacity = Math.max(0, 0.35 - s / steps * 0.35);
        ctx!.beginPath();
        ctx!.moveTo(cx, cy);
        ctx!.arc(cx, cy, R, a0, a1, true);
        ctx!.closePath();
        ctx!.fillStyle = `rgba(59,130,246,${opacity})`;
        ctx!.fill();
      }

      // Sweep line
      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      ctx!.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R);
      ctx!.strokeStyle = 'rgba(147,197,253,0.9)';
      ctx!.lineWidth = 2;
      ctx!.stroke();

      // Blips
      blips.forEach(b => {
        let diff = angle - b.a;
        while (diff < 0) diff += Math.PI * 2;
        diff = diff % (Math.PI * 2);
        const fade = diff < Math.PI * 2 ? Math.max(0, 1 - diff / (Math.PI * 1.5)) : 0;
        if (fade > 0.02) {
          const bx = cx + Math.cos(b.a) * b.r * R;
          const by = cy + Math.sin(b.a) * b.r * R;
          ctx!.beginPath();
          ctx!.arc(bx, by, 3.5, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(52,211,153,${fade})`;
          ctx!.fill();
          ctx!.beginPath();
          ctx!.arc(bx, by, 7, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(52,211,153,${fade * 0.3})`;
          ctx!.fill();
        }
      });

      // Center dot
      ctx!.beginPath();
      ctx!.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx!.fillStyle = 'rgba(147,197,253,0.9)';
      ctx!.fill();

      // Border circle
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, Math.PI * 2);
      ctx!.strokeStyle = 'rgba(59,130,246,0.4)';
      ctx!.lineWidth = 1.5;
      ctx!.stroke();

      angle += 0.018;
      animFrame = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animFrame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={260}
      height={260}
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
    <div className="stat-card">
      <div className="stat-icon-wrap" style={{ '--accent': color } as React.CSSProperties}>
        {pulse && <span className="stat-pulse" style={{ background: color }} />}
        <Icon className="stat-icon" style={{ color }} />
      </div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value" style={{ color }}>
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
  gradientFrom,
  gradientTo,
  tag,
  index,
}: (typeof sections)[number] & { index: number }) {
  return (
    <Link
      href={href}
      className="section-card"
      style={
        {
          '--accent': accentColor,
          '--from': gradientFrom,
          '--to': gradientTo,
          animationDelay: `${index * 0.12}s`,
        } as React.CSSProperties
      }
    >
      {/* Top accent bar */}
      <div className="card-accent-bar" />

      {/* Glow backdrop */}
      <div className="card-glow" />

      {/* Tag */}
      <span className="card-tag">{tag}</span>

      {/* Icon */}
      <div className="card-icon-wrap">
        <Icon className="card-icon" />
      </div>

      {/* Content */}
      <h3 className="card-title">{title}</h3>
      <p className="card-desc">{description}</p>

      {/* CTA */}
      <div className="card-cta">
        <span>Open module</span>
        <ArrowRight className="card-arrow" />
      </div>

      {/* Corner badge */}
      <div className="card-corner-badge">
        <Lock className="w-3 h-3" />
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
        /* ── Fonts ── */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');

        /* ── Root tokens ── */
        .hp-root {
          --navy-950: #020817;
          --navy-900: #0a1628;
          --navy-800: #0f2040;
          --navy-700: #173060;
          --blue-500: #3b82f6;
          --blue-400: #60a5fa;
          --blue-300: #93c5fd;
          --gold-400: #fbbf24;
          --gold-300: #fcd34d;
          --green-400: #34d399;
          --text-primary: #f0f6ff;
          --text-muted: #7ba7d4;
          font-family: 'Inter', system-ui, sans-serif;
          background: var(--navy-950);
          color: var(--text-primary);
          min-height: 100vh;
        }

        /* ── Hero ── */
        .hero-section {
          position: relative;
          min-height: 620px;
          display: flex;
          align-items: center;
          overflow: hidden;
          background: linear-gradient(135deg, #020817 0%, #0a1c3e 40%, #0f243a 70%, #020817 100%);
        }

        /* Grid lines */
        .hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px);
          background-size: 44px 44px;
          pointer-events: none;
        }

        /* Orbs */
        .hero-orb-1 {
          position: absolute;
          top: -80px;
          left: -100px;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(29,78,216,0.25) 0%, transparent 70%);
          pointer-events: none;
          animation: orbDrift1 14s ease-in-out infinite;
        }
        .hero-orb-2 {
          position: absolute;
          bottom: -120px;
          right: -80px;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%);
          pointer-events: none;
          animation: orbDrift2 18s ease-in-out infinite;
        }
        .hero-orb-3 {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(251,191,36,0.04) 0%, transparent 70%);
          pointer-events: none;
        }

        @keyframes orbDrift1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(40px, 30px); }
        }
        @keyframes orbDrift2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, -20px); }
        }

        /* Scanline */
        .hero-scanline {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.04) 2px,
            rgba(0,0,0,0.04) 4px
          );
          pointer-events: none;
          opacity: 0.5;
        }

        /* Hero inner layout */
        .hero-inner {
          position: relative;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 80px 32px 100px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 48px;
          align-items: center;
        }
        @media (max-width: 900px) {
          .hero-inner {
            grid-template-columns: 1fr;
            text-align: center;
            padding: 60px 20px 80px;
          }
          .radar-wrap { display: none; }
        }

        /* Badge */
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 100px;
          background: rgba(59,130,246,0.12);
          border: 1px solid rgba(59,130,246,0.3);
          color: var(--blue-300);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 24px;
          backdrop-filter: blur(8px);
        }
        .hero-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--green-400);
          animation: badgePulse 2s ease-in-out infinite;
        }
        @keyframes badgePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.8); }
        }

        /* Logo row */
        .hero-logo-row {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
        }
        @media (max-width: 900px) {
          .hero-logo-row { justify-content: center; }
        }
        .hero-logo-ring {
          position: relative;
          flex-shrink: 0;
        }
        .hero-logo-ring::before {
          content: '';
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 1px solid rgba(251,191,36,0.3);
          animation: ringRotate 20s linear infinite;
        }
        .hero-logo-ring::after {
          content: '';
          position: absolute;
          inset: -16px;
          border-radius: 50%;
          border: 1px dashed rgba(59,130,246,0.2);
          animation: ringRotate 30s linear infinite reverse;
        }
        @keyframes ringRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .hero-logo-text h2 {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--gold-300);
          line-height: 1.3;
        }
        .hero-logo-text p {
          font-size: 11px;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          margin-top: 2px;
        }

        /* Hero heading */
        .hero-h1 {
          font-size: clamp(40px, 6vw, 72px);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: #ffffff;
          margin-bottom: 8px;
        }
        .hero-h1 span {
          background: linear-gradient(90deg, #60a5fa, #93c5fd, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-subtitle {
          font-size: clamp(18px, 2.5vw, 24px);
          color: var(--blue-300);
          font-weight: 600;
          margin-bottom: 16px;
          letter-spacing: -0.01em;
        }
        .hero-desc {
          font-size: 15px;
          color: var(--text-muted);
          line-height: 1.7;
          max-width: 540px;
          margin-bottom: 40px;
        }
        @media (max-width: 900px) {
          .hero-desc { margin-left: auto; margin-right: auto; }
        }

        /* CTA button */
        .hero-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          border-radius: 10px;
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
          color: white;
          font-weight: 700;
          font-size: 15px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 0 30px rgba(59,130,246,0.35), 0 4px 15px rgba(0,0,0,0.3);
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .hero-cta::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .hero-cta:hover::before { opacity: 1; }
        .hero-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 50px rgba(59,130,246,0.5), 0 8px 25px rgba(0,0,0,0.4);
        }

        /* Radar */
        .radar-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .radar-canvas {
          border-radius: 50%;
          box-shadow: 0 0 60px rgba(59,130,246,0.25), 0 0 120px rgba(59,130,246,0.1);
        }
        .radar-label {
          position: absolute;
          top: -28px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          color: rgba(147,197,253,0.7);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        /* Hero bottom fade */
        .hero-fade {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 120px;
          background: linear-gradient(to bottom, transparent, #020817);
          pointer-events: none;
        }

        /* ── Stats bar ── */
        .stats-bar {
          background: linear-gradient(135deg, #0a1628, #0f2040);
          border-top: 1px solid rgba(59,130,246,0.15);
          border-bottom: 1px solid rgba(59,130,246,0.1);
          padding: 20px 32px;
        }
        .stats-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        @media (max-width: 768px) {
          .stats-inner { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .stats-inner { grid-template-columns: 1fr 1fr; }
          .stats-bar { padding: 16px 16px; }
        }
        .stat-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(59,130,246,0.1);
          transition: all 0.25s ease;
        }
        .stat-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(59,130,246,0.25);
        }
        .stat-icon-wrap {
          position: relative;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          flex-shrink: 0;
        }
        .stat-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          opacity: 0.3;
          animation: statPulse 2.5s ease-in-out infinite;
        }
        @keyframes statPulse {
          0%, 100% { transform: scale(0.9); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0; }
        }
        .stat-icon {
          width: 18px;
          height: 18px;
          position: relative;
          z-index: 1;
        }
        .stat-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 2px;
        }
        .stat-value {
          font-size: 16px;
          font-weight: 800;
          line-height: 1;
          font-family: 'JetBrains Mono', monospace;
        }

        /* ── Section cards ── */
        .sections-area {
          background: #020817;
          padding: 60px 32px 80px;
        }
        .sections-header {
          max-width: 1280px;
          margin: 0 auto 48px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .sections-title-group h2 {
          font-size: 28px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }
        .sections-title-group p {
          font-size: 14px;
          color: var(--text-muted);
        }
        .sections-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(147,197,253,0.5);
        }
        .divider-line {
          width: 40px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(59,130,246,0.5));
        }

        .sections-grid {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 960px) {
          .sections-grid { grid-template-columns: 1fr; max-width: 520px; }
        }

        /* Card */
        .section-card {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 32px 28px 28px;
          border-radius: 18px;
          background: linear-gradient(145deg, #0d1f3c, #081528);
          border: 1px solid rgba(59,130,246,0.12);
          text-decoration: none;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          animation: cardReveal 0.5s ease-out both;
        }
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .section-card:hover {
          transform: translateY(-6px);
          border-color: var(--accent, rgba(59,130,246,0.4));
          box-shadow: 0 0 0 1px var(--accent, #3b82f6), 0 20px 60px rgba(0,0,0,0.5), 0 0 80px rgba(59,130,246,0.1);
        }

        /* Top accent bar */
        .card-accent-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--from, #1d4ed8), var(--to, #0ea5e9));
          opacity: 0.7;
          transition: opacity 0.3s;
        }
        .section-card:hover .card-accent-bar { opacity: 1; }

        /* Glow */
        .card-glow {
          position: absolute;
          top: -50px;
          right: -50px;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--accent, rgba(59,130,246,0.15)) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.4s;
          pointer-events: none;
        }
        .section-card:hover .card-glow { opacity: 1; }

        /* Tag */
        .card-tag {
          display: inline-flex;
          align-items: center;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent, #3b82f6);
          margin-bottom: 20px;
          opacity: 0.8;
        }
        .card-tag::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--accent, #3b82f6);
          margin-right: 8px;
        }

        /* Icon */
        .card-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          transition: all 0.3s ease;
          position: relative;
        }
        .card-icon-wrap::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--from, #1d4ed8), var(--to, #0ea5e9));
          opacity: 0;
          transition: opacity 0.3s;
        }
        .section-card:hover .card-icon-wrap::after { opacity: 0.2; }
        .section-card:hover .card-icon-wrap {
          transform: scale(1.08);
          border-color: var(--accent, rgba(59,130,246,0.3));
        }
        .card-icon {
          width: 24px;
          height: 24px;
          color: var(--accent, #3b82f6);
          position: relative;
          z-index: 1;
        }

        /* Text */
        .card-title {
          font-size: 19px;
          font-weight: 700;
          color: #e2eeff;
          margin-bottom: 10px;
          letter-spacing: -0.01em;
          line-height: 1.3;
        }
        .card-desc {
          font-size: 13.5px;
          color: var(--text-muted);
          line-height: 1.65;
          flex: 1;
          margin-bottom: 24px;
        }

        /* CTA */
        .card-cta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: var(--accent, #3b82f6);
          transition: gap 0.25s ease;
        }
        .section-card:hover .card-cta { gap: 10px; }
        .card-arrow {
          width: 16px;
          height: 16px;
          transition: transform 0.25s ease;
        }
        .section-card:hover .card-arrow { transform: translateX(4px); }

        /* Corner badge */
        .card-corner-badge {
          position: absolute;
          bottom: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(147,197,253,0.3);
          transition: color 0.3s;
        }
        .section-card:hover .card-corner-badge { color: rgba(147,197,253,0.6); }

        /* ── Footer strip ── */
        .hp-footer-strip {
          background: linear-gradient(135deg, #0a1628, #020817);
          border-top: 1px solid rgba(59,130,246,0.1);
          padding: 24px 32px;
        }
        .hp-footer-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .hp-footer-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-muted);
        }
        .hp-footer-left a {
          color: var(--blue-400);
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }
        .hp-footer-left a:hover { color: var(--blue-300); }
        .hp-footer-right {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(147,197,253,0.4);
          font-family: 'JetBrains Mono', monospace;
        }
        .fp-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--green-400);
          animation: badgePulse 2.5s ease-in-out infinite;
        }
      `}</style>

      <div className="hp-root min-h-screen flex flex-col">
        <Header />

        <div className="flex flex-1 w-full pt-14">
          <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col">

            {/* ── Hero ── */}
            <section className="hero-section">
              <div className="hero-grid" aria-hidden />
              <div className="hero-orb-1" aria-hidden />
              <div className="hero-orb-2" aria-hidden />
              <div className="hero-orb-3" aria-hidden />
              <div className="hero-scanline" aria-hidden />

              <div className="hero-inner">
                {/* Left content */}
                <div>
                  {/* Live badge */}
                  <div className="hero-badge">
                    <span className="hero-badge-dot" />
                    <Radio className="w-3 h-3" />
                    SOCO Command System · Live
                  </div>

                  {/* Logo row */}
                  <div className="hero-logo-row">
                    <div className="hero-logo-ring">
                      <Image
                        src="/logo.png"
                        alt="Sri Lanka Police"
                        width={68}
                        height={68}
                        className="rounded-full object-contain relative z-10"
                        priority
                      />
                    </div>
                    <div className="hero-logo-text">
                      <h2>Sri Lanka Police</h2>
                      <p>SOCO · Internal Operations Platform</p>
                    </div>
                  </div>

                  {/* Heading */}
                  <h1 className="hero-h1">
                    Command &amp;{' '}
                    <span>Control</span>
                    <br />
                    Center
                  </h1>
                  <p className="hero-subtitle">Scene of Crime &amp; Operations</p>
                  <p className="hero-desc">
                    A unified digital operations platform for Sri Lanka Police — manage internal
                    case workflows, monitor compliance, and drive data-informed policing across all
                    divisions.
                  </p>

                  {/* CTA */}
                  <Link href="/complaints" className="hero-cta">
                    <Shield className="w-5 h-5" />
                    Access System
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Radar */}
                <div className="radar-wrap">
                  <span className="radar-label">[ TRACKING ACTIVE ]</span>
                  {mounted && <RadarCanvas />}
                </div>
              </div>

              <div className="hero-fade" aria-hidden />
            </section>

            {/* ── Stats bar ── */}
            <div className="stats-bar">
              <div className="stats-inner">
                {stats.map(s => (
                  <StatCard key={s.label} {...s} />
                ))}
              </div>
            </div>

            {/* ── Module cards ── */}
            <section className="sections-area">
              <div className="sections-header">
                <div className="sections-title-group">
                  <h2>Module Access</h2>
                  <p>Select a module to get started</p>
                </div>
                <div className="sections-divider">
                  <span className="divider-line" />
                  <BarChart3 className="w-3.5 h-3.5" />
                  3 modules available
                  <span className="divider-line" style={{ transform: 'rotate(180deg)' }} />
                </div>
              </div>

              <div className="sections-grid">
                {sections.map((s, i) => (
                  <SectionCard key={s.href} {...s} index={i} />
                ))}
              </div>
            </section>

            {/* ── Footer strip ── */}
            <div className="hp-footer-strip mt-auto">
              <div className="hp-footer-inner">
                <p className="hp-footer-left">
                  <Lock className="w-3.5 h-3.5" />
                  Need help? Visit{' '}
                  <Link href="/config">Configuration</Link>{' '}
                  for system settings.
                </p>
                <div className="hp-footer-right">
                  <span className="fp-dot" />
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
