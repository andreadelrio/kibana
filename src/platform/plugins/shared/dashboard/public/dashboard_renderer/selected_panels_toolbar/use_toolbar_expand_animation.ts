/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

interface Size {
  width: number;
  height: number;
}

type Direction = 'open' | 'close';

const OPEN_DURATION = 260;
const CLOSE_DURATION = 200;
const EASE_OUT = 'cubic-bezier(0.2, 0, 0, 1)';

const getSize = (element: HTMLElement): Size => {
  const { width, height } = element.getBoundingClientRect();
  return { width, height };
};

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Expands the surface above the stationary button row, preserving visual state on reversal. */
export const useToolbarExpandAnimation = () => {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const moreRef = useRef<HTMLDivElement | null>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMoreMounted, setIsMoreMounted] = useState(false);

  const pendingRef = useRef<{
    direction: Direction;
    from: Size;
    moreOpacity: number;
    moreTransform: string;
    isInterrupted: boolean;
  } | null>(null);
  const surfaceAnimationRef = useRef<Animation | null>(null);
  const moreAnimationRef = useRef<Animation | null>(null);

  const cancelAnimations = useCallback(() => {
    for (const animation of [surfaceAnimationRef.current, moreAnimationRef.current]) {
      if (animation) {
        animation.onfinish = null;
        animation.cancel();
      }
    }
    surfaceAnimationRef.current = null;
    moreAnimationRef.current = null;
  }, []);

  const toggle = useCallback(() => {
    const surface = surfaceRef.current;
    const more = moreRef.current;
    const direction: Direction = isExpanded ? 'close' : 'open';
    const moreStyle = more ? getComputedStyle(more) : null;

    // Read animated values before cancellation restores the underlying styles.
    pendingRef.current = surface
      ? {
          direction,
          from: getSize(surface),
          moreOpacity: moreStyle ? Number(moreStyle.opacity) : 0,
          moreTransform: moreStyle?.transform || 'translateY(4px)',
          isInterrupted: surfaceAnimationRef.current?.playState === 'running',
        }
      : null;
    cancelAnimations();

    setIsExpanded(!isExpanded);
    if (direction === 'open') setIsMoreMounted(true);
  }, [cancelAnimations, isExpanded]);

  useLayoutEffect(() => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    const surface = surfaceRef.current;
    const content = contentRef.current;
    const more = moreRef.current;
    if (!pending || !surface || !content || !more) return;

    const isOpening = pending.direction === 'open';
    // Options remain mounted for their exit, but must no longer accept focus or clicks.
    more.inert = !isOpening;

    if (typeof surface.animate !== 'function' || prefersReducedMotion()) {
      if (!isOpening) setIsMoreMounted(false);
      return;
    }

    const contentSize = getSize(content);
    const targetSize = isOpening
      ? contentSize
      : {
          width: contentSize.width,
          height: contentSize.height - more.offsetHeight,
        };
    const surfaceAnimation = surface.animate(
      [
        { width: `${pending.from.width}px`, height: `${pending.from.height}px` },
        { width: `${targetSize.width}px`, height: `${targetSize.height}px` },
      ],
      {
        duration: isOpening ? OPEN_DURATION : CLOSE_DURATION,
        easing: EASE_OUT,
        fill: isOpening ? 'none' : 'forwards',
      }
    );
    surfaceAnimationRef.current = surfaceAnimation;

    moreAnimationRef.current = more.animate(
      [
        { opacity: pending.moreOpacity, transform: pending.moreTransform },
        {
          opacity: isOpening ? 1 : 0,
          transform: isOpening ? 'none' : 'translateY(4px)',
        },
      ],
      {
        duration: isOpening ? 140 : 90,
        delay: isOpening && !pending.isInterrupted ? 40 : 0,
        easing: EASE_OUT,
        fill: isOpening ? 'backwards' : 'both',
      }
    );
    if (!isOpening) {
      surfaceAnimation.onfinish = () => setIsMoreMounted(false);
    }
  }, [isExpanded]);

  useLayoutEffect(() => {
    if (!isMoreMounted) cancelAnimations();
  }, [cancelAnimations, isMoreMounted]);

  useEffect(() => cancelAnimations, [cancelAnimations]);

  return { isExpanded, isMoreMounted, toggle, surfaceRef, contentRef, moreRef };
};
