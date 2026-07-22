'use client';

import { useEffect, useRef, useState } from 'react';

interface CountUpNumberProps {
  value: number;
  durationMs?: number;
  decimals?: number;
  suffix?: string;
  formatter?: (value: number) => string;
}

export default function CountUpNumber({ value, durationMs = 900, decimals = 0, suffix = '', formatter }: CountUpNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    const startValue = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + (value - startValue) * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayValue(value);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [value, durationMs]);

  const rounded = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toLocaleString();

  return <>{formatter ? formatter(displayValue) : `${rounded}${suffix}`}</>;
}
