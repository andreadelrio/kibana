/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

type Direction = 'open' | 'close';

const OPEN_DURATION = 260;
const CLOSE_DURATION = 200;
/** The first-ever expand plays the expressive compress / overshoot version */
const FIRST_OPEN_DURATION = 400;
const EASE_OUT = 'cubic-bezier(0.2, 0, 0, 1)';
const FIRST_EXPAND_STORAGE_KEY = 'dashboard:selectedPanelsToolbar:hasExpanded';

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const hasExpandedBefore = () => {
  try {
    return window.localStorage.getItem(FIRST_EXPAND_STORAGE_KEY) === 'true';
  } catch {
    return true;
  }
};

const rememberExpanded = () => {
  try {
    window.localStorage.setItem(FIRST_EXPAND_STORAGE_KEY, 'true');
  } catch {
    // storage unavailable, the expressive version may play again
  }
};

/** Top inset of an `inset(...)` clip-path, i.e. how much of the frame is currently hidden */
const getClipTop = (element: HTMLElement) => {
  const match = /inset\(\s*(-?[\d.]+)px/.exec(getComputedStyle(element).clipPath ?? '');
  return match ? Number(match[1]) : 0;
};

/**
 * Expands the toolbar upward into a larger panel while keeping its bottom edge anchored.
 *
 * The frame (white surface + content) is always laid out at its natural size and revealed with a
 * `clip-path` that grows from the bottom edge, so nothing is resized per frame. The shadow is a
 * `drop-shadow` on an ancestor, which follows the clipped shape.
 *
 * - `frameRef`: the clipped wrapper around the surface and the content.
 * - `moreRef`: the extra options shown when expanded. They stay mounted while closing so they can
 *   fade out, but are made inert.
 *
 * Opening and closing can be interrupted: each one starts from the current visual state.
 */
export const useToolbarExpandAnimation = () => {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const moreRef = useRef<HTMLDivElement | null>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMoreMounted, setIsMoreMounted] = useState(false);

  const pendingRef = useRef<{
    direction: Direction;
    /** visible height of the frame at the moment of the toggle */
    fromHeight: number;
    moreOpacity: number;
    moreTransform: string;
    moreFilter: string;
  } | null>(null);
  const frameAnimationRef = useRef<Animation | null>(null);
  const moreAnimationRef = useRef<Animation | null>(null);

  const cancelAnimations = useCallback(() => {
    for (const animation of [frameAnimationRef.current, moreAnimationRef.current]) {
      if (animation) {
        animation.onfinish = null;
        animation.cancel();
      }
    }
    frameAnimationRef.current = null;
    moreAnimationRef.current = null;
  }, []);

  const toggle = useCallback(() => {
    const frame = frameRef.current;
    const more = moreRef.current;
    const direction: Direction = isExpanded ? 'close' : 'open';
    const moreStyle = more ? getComputedStyle(more) : null;

    // Read animated values before cancellation restores the underlying styles.
    pendingRef.current = frame
      ? {
          direction,
          fromHeight: frame.getBoundingClientRect().height - getClipTop(frame),
          moreOpacity: moreStyle ? Number(moreStyle.opacity) : 0,
          moreTransform:
            moreStyle?.transform && moreStyle.transform !== 'none'
              ? moreStyle.transform
              : 'translateY(4px)',
          moreFilter:
            moreStyle?.filter && moreStyle.filter !== 'none' ? moreStyle.filter : 'blur(4px)',
        }
      : null;
    cancelAnimations();

    setIsExpanded(!isExpanded);
    if (direction === 'open') setIsMoreMounted(true);
  }, [cancelAnimations, isExpanded]);

  useLayoutEffect(() => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    const frame = frameRef.current;
    const more = moreRef.current;
    if (!pending || !frame || !more) return;

    const isOpening = pending.direction === 'open';
    // Options remain mounted for their exit, but must no longer accept focus or clicks.
    more.inert = !isOpening;

    if (typeof frame.animate !== 'function' || prefersReducedMotion()) {
      if (!isOpening) setIsMoreMounted(false);
      return;
    }

    const { width, height: fullHeight } = frame.getBoundingClientRect();
    const toHeight = isOpening ? fullHeight : fullHeight - more.offsetHeight;
    const radius = getComputedStyle(frame).borderTopLeftRadius || '0px';
    const clip = (visibleHeight: number, side = 0) =>
      `inset(${Math.max(0, fullHeight - visibleHeight)}px ${side}px 0px ${side}px round ${radius})`;
    const lerp = (progress: number) =>
      pending.fromHeight + (toHeight - pending.fromHeight) * progress;

    const isFirstExpand = isOpening && pending.moreOpacity === 0 && !hasExpandedBefore();
    if (isOpening) rememberExpanded();

    let frameKeyframes: Keyframe[];
    let duration: number;
    if (isFirstExpand) {
      // compress, expand quickly, overshoot slightly, then settle
      frameKeyframes = [
        { offset: 0, clipPath: clip(lerp(0)), transform: 'none' },
        {
          offset: 0.14,
          clipPath: clip(pending.fromHeight * 0.64, width * 0.02),
          transform: 'none',
        },
        { offset: 0.29, clipPath: clip(pending.fromHeight * 1.2), transform: 'none' },
        { offset: 0.375, clipPath: clip(lerp(0.25)), transform: 'none' },
        { offset: 0.5, clipPath: clip(lerp(0.855)), transform: 'none' },
        { offset: 0.65, clipPath: clip(lerp(1)), transform: 'scale(1.03, 1.04)' },
        { offset: 0.825, clipPath: clip(lerp(1)), transform: 'none' },
        { offset: 1, clipPath: clip(lerp(1)), transform: 'none' },
      ].map((keyframe) => ({ ...keyframe, easing: 'ease-in-out' }));
      duration = FIRST_OPEN_DURATION;
    } else {
      frameKeyframes = [{ clipPath: clip(lerp(0)) }, { clipPath: clip(lerp(1)) }];
      duration = isOpening ? OPEN_DURATION : CLOSE_DURATION;
    }

    const frameAnimation = frame.animate(frameKeyframes, {
      duration,
      easing: isFirstExpand ? 'linear' : EASE_OUT,
      // hold the compact clip until the extra options are unmounted
      fill: isOpening ? 'none' : 'forwards',
    });
    frameAnimationRef.current = frameAnimation;

    // the options materialize (opacity + rise + blur that clears) and leave quieter and sharp
    moreAnimationRef.current = more.animate(
      [
        {
          opacity: pending.moreOpacity,
          transform: pending.moreTransform,
          filter: isOpening ? pending.moreFilter : 'blur(0px)',
        },
        {
          opacity: isOpening ? 1 : 0,
          transform: isOpening ? 'none' : 'translateY(4px)',
          filter: 'blur(0px)',
        },
      ],
      {
        duration: isOpening ? 160 : 120,
        delay: isFirstExpand ? 100 : 0,
        easing: EASE_OUT,
        fill: isOpening ? 'backwards' : 'both',
      }
    );
    if (!isOpening) {
      frameAnimation.onfinish = () => setIsMoreMounted(false);
    }
  }, [isExpanded]);

  // once the extra options are gone, the frame can follow the content size again
  useLayoutEffect(() => {
    if (!isMoreMounted) cancelAnimations();
  }, [cancelAnimations, isMoreMounted]);

  useEffect(() => cancelAnimations, [cancelAnimations]);

  return { isExpanded, isMoreMounted, toggle, frameRef, moreRef };
};
