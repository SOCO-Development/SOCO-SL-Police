'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

interface FeatureCardProps {
  title: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  /** Optional Sinhala subtitle below title */
  subtitle?: ReactNode;
  /** Optional description text */
  description?: string;
}

export default function FeatureCard({ title, icon, href, onClick, subtitle, description }: FeatureCardProps) {
  const cardContent = (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-2xl border border-gray-100 hover:border-blue-200 p-8 cursor-pointer h-full flex flex-col items-center justify-center text-center group relative overflow-hidden animate-fade-in transition-[shadow,border-color] duration-300 ease-in-out">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-blue-50/0 to-teal-50/0 group-hover:from-blue-50/50 group-hover:via-blue-50/30 group-hover:to-teal-50/50 transition-[background] duration-300 ease-in-out"></div>

      {/* Icon container with background */}
      <div className="relative mb-5 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-teal-50 group-hover:from-blue-100 group-hover:to-teal-100 transition-[background] duration-300 ease-in-out transform group-hover:scale-110 group-hover:-translate-y-2 will-change-transform transition-transform duration-300 ease-in-out">
        <div className="text-blue-600 group-hover:text-blue-700 transition-colors duration-300 ease-in-out">
          {icon}
        </div>
      </div>

      <h3 className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 relative z-10 transition-colors duration-300 ease-in-out leading-tight">
        {title}
      </h3>
      {subtitle && <p className="text-xs text-gray-400 relative z-10 mb-1 mt-0.5">{subtitle}</p>}
      {description && <p className="text-xs text-gray-500 relative z-10 mt-2 leading-relaxed">{description}</p>}

      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/0 to-teal-500/0 group-hover:from-blue-500/5 group-hover:to-teal-500/5 rounded-bl-full transition-[background] duration-300 ease-in-out"></div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full transform hover:scale-[1.02] transition-transform duration-300 ease-in-out will-change-transform">
        {cardContent}
      </Link>
    );
  }

  return <div onClick={onClick} className="transform hover:scale-[1.02] transition-transform duration-300 ease-in-out will-change-transform">{cardContent}</div>;
}

