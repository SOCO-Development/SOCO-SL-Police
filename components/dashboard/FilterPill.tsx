'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Filter as FilterIcon } from 'lucide-react';

export interface PillOption {
  value: string;
  label: string;
}

interface FilterPillProps {
  label: string;
  icon?: React.ReactNode;
  displayText: string;
  children: (close: () => void) => React.ReactNode;
}

/**
 * Compact rounded-pill dropdown trigger (label + chevron) that renders
 * arbitrary content in a positioned portal panel below it. Used to give
 * MultiSelect/DatePicker-driven filters a pill look without touching those
 * shared components' own trigger styling (they're used elsewhere as boxes).
 */
export default function FilterPill({ label, icon, displayText, children }: FilterPillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId().replace(/:/g, '');

  const updatePosition = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, left: rect.left });
  }, []);

  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const onMove = () => updatePosition();
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const t = event.target as Node;
      if (triggerRef.current?.contains(t)) return;
      const panelEl = document.getElementById(`filter-pill-panel-${panelId}`);
      if (panelEl?.contains(t)) return;
      setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen, panelId]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={`flex items-center gap-2 pl-3.5 pr-3 py-2 rounded-full border text-sm transition-colors ${
          isOpen ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        {icon}
        <span className="text-gray-400 font-medium">{label}:</span>
        <span className="font-semibold truncate max-w-[160px]">{displayText}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && pos && typeof document !== 'undefined' &&
        createPortal(
          <div
            id={`filter-pill-panel-${panelId}`}
            style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 99999 }}
            className="min-w-[240px] max-w-[320px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          >
            {children(() => setIsOpen(false))}
          </div>,
          document.body,
        )}
    </>
  );
}

export function FilterPillIcon() {
  return <FilterIcon className="w-3.5 h-3.5 text-gray-400" />;
}
