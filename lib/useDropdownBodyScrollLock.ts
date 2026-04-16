'use client';

import { useEffect } from 'react';

let lockCount = 0;
let frozenScrollX = 0;
let frozenScrollY = 0;

const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'PageUp',
  'PageDown',
  'Home',
  'End',
]);

function isScrollLockExemptTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Node)) return false;
  const el = target instanceof Element ? target : target.parentElement;
  return !!el?.closest('[data-scroll-lock-exempt]');
}

/** Nested overflow regions (form panels, etc.) may still scroll; only block when the viewport would move. */
function shouldAllowWheelForNestedScroller(e: WheelEvent): boolean {
  const t = e.target;
  if (!(t instanceof Element)) return false;
  if (t.closest('[data-scroll-lock-exempt]')) return true;

  const root = document.scrollingElement ?? document.documentElement;
  let cur: Element | null = t;
  while (cur && cur !== root) {
    const style = window.getComputedStyle(cur);
    const oy = style.overflowY;
    const ox = style.overflowX;
    const canY =
      (oy === 'auto' || oy === 'scroll' || oy === 'overlay') && cur.scrollHeight > cur.clientHeight + 1;
    const canX =
      (ox === 'auto' || ox === 'scroll' || ox === 'overlay') && cur.scrollWidth > cur.clientWidth + 1;

    if (canY && e.deltaY !== 0) {
      const st = cur.scrollTop;
      const max = Math.max(0, cur.scrollHeight - cur.clientHeight);
      const dy = e.deltaY;
      if ((dy > 0 && st < max - 0.5) || (dy < 0 && st > 0.5)) return true;
    }
    if (canX && e.deltaX !== 0) {
      const sl = cur.scrollLeft;
      const max = Math.max(0, cur.scrollWidth - cur.clientWidth);
      const dx = e.deltaX;
      if ((dx > 0 && sl < max - 0.5) || (dx < 0 && sl > 0.5)) return true;
    }
    cur = cur.parentElement;
  }
  return false;
}

function onWheelCapture(e: WheelEvent) {
  if (lockCount === 0) return;
  if (shouldAllowWheelForNestedScroller(e)) return;
  e.preventDefault();
}

function onTouchMoveCapture(e: TouchEvent) {
  if (lockCount === 0) return;
  if (isScrollLockExemptTarget(e.target)) return;
  e.preventDefault();
}

function onKeyDownCapture(e: KeyboardEvent) {
  if (lockCount === 0) return;
  if (!SCROLL_KEYS.has(e.key)) return;
  if (isScrollLockExemptTarget(e.target)) return;
  e.preventDefault();
}

function onScrollRestore() {
  if (lockCount === 0) return;
  if (window.scrollX !== frozenScrollX || window.scrollY !== frozenScrollY) {
    window.scrollTo(frozenScrollX, frozenScrollY);
  }
}

const wheelListenerOpts: AddEventListenerOptions = { capture: true, passive: false };
const touchListenerOpts: AddEventListenerOptions = { capture: true, passive: false };
const scrollListenerOpts: AddEventListenerOptions = { capture: true, passive: true };
const keyListenerOpts: AddEventListenerOptions = { capture: true };

function applyLock() {
  if (lockCount === 0) {
    frozenScrollX = window.scrollX;
    frozenScrollY = window.scrollY;
    document.addEventListener('wheel', onWheelCapture, wheelListenerOpts);
    document.addEventListener('touchmove', onTouchMoveCapture, touchListenerOpts);
    window.addEventListener('scroll', onScrollRestore, scrollListenerOpts);
    document.addEventListener('keydown', onKeyDownCapture, keyListenerOpts);
  }
  lockCount += 1;
}

function releaseLock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.removeEventListener('wheel', onWheelCapture, wheelListenerOpts);
    document.removeEventListener('touchmove', onTouchMoveCapture, touchListenerOpts);
    window.removeEventListener('scroll', onScrollRestore, scrollListenerOpts);
    document.removeEventListener('keydown', onKeyDownCapture, keyListenerOpts);
  }
}

/**
 * Disables viewport scrolling while a floating dropdown is open without using
 * overflow:hidden (scrollbar stays visible — no layout jump).
 * Dropdown portals use `data-scroll-lock-exempt` so their inner lists still scroll.
 * Nested page regions (overflow:auto panels) can still scroll with the wheel.
 */
export function useDropdownBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    applyLock();
    return () => releaseLock();
  }, [locked]);
}
