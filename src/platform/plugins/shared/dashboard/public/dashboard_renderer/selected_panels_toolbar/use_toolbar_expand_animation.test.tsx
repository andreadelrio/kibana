/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useToolbarExpandAnimation } from './use_toolbar_expand_animation';

const FIRST_EXPAND_STORAGE_KEY = 'dashboard:selectedPanelsToolbar:hasExpanded';

const Harness = () => {
  const { isMoreMounted, toggle, frameRef, moreRef } = useToolbarExpandAnimation();
  return (
    <div ref={frameRef} data-test-subj="frame">
      {isMoreMounted && <div ref={moreRef} data-test-subj="more" />}
      <button onClick={toggle}>Toggle</button>
    </div>
  );
};

const createAnimation = () => ({
  cancel: jest.fn(),
  onfinish: null as (() => void) | null,
  playState: 'running',
});

const animate = jest.fn(createAnimation);
const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate');
const originalMatchMedia = window.matchMedia;
let reducedMotion = false;

const toggle = () => fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));

// each toggle starts two animations: the frame clip, then the options fade
const getAnimation = (index: number): ReturnType<typeof createAnimation> =>
  animate.mock.results[index].value;

beforeEach(() => {
  reducedMotion = false;
  animate.mockClear();
  window.localStorage.setItem(FIRST_EXPAND_STORAGE_KEY, 'true');
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    value: animate,
  });
  jest.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    ...originalMatchMedia(query),
    matches: reducedMotion,
  }));
  // the frame is 48px tall when compact and 180px with the extra options
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => {
    const height = screen.queryByTestId('more') ? 180 : 48;
    return {
      width: 400,
      height,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 400,
      bottom: height,
      toJSON: () => ({}),
    };
  });
  jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(132);
});

afterEach(() => {
  jest.restoreAllMocks();
  window.localStorage.clear();
  if (originalAnimate) {
    Object.defineProperty(HTMLElement.prototype, 'animate', originalAnimate);
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'animate');
  }
});

test('reveals the frame from the bottom edge with a clip-path instead of resizing it', () => {
  render(<Harness />);
  toggle();
  expect(animate).toHaveBeenNthCalledWith(
    1,
    [
      { clipPath: 'inset(132px 0px 0px 0px round 0px)' },
      { clipPath: 'inset(0px 0px 0px 0px round 0px)' },
    ],
    expect.objectContaining({ duration: 260, fill: 'none' })
  );
  // the options materialize: opacity + rise + blur that clears
  expect(animate).toHaveBeenNthCalledWith(
    2,
    [
      { opacity: 0, transform: 'translateY(4px)', filter: 'blur(4px)' },
      { opacity: 1, transform: 'none', filter: 'blur(0px)' },
    ],
    expect.objectContaining({ duration: 160 })
  );
});

test('keeps exiting options inert and mounted until the frame finishes closing', () => {
  render(<Harness />);
  toggle();
  const more = screen.getByTestId('more');
  expect(more.inert).toBe(false);

  toggle();
  expect(more.inert).toBe(true);
  expect(more).toBeInTheDocument();
  act(() => getAnimation(2).onfinish?.());
  expect(screen.queryByTestId('more')).not.toBeInTheDocument();
});

test('reverses from the current visual state', () => {
  render(<Harness />);
  toggle();
  const frame = screen.getByTestId('frame');
  const more = screen.getByTestId('more');
  // mid-animation: 60px of the frame still clipped, options half faded in
  frame.style.clipPath = 'inset(60px 0px 0px 0px round 0px)';
  more.style.opacity = '0.5';
  more.style.transform = 'translateY(2px) scale(0.97)';
  toggle();

  expect(getAnimation(0).cancel).toHaveBeenCalled();
  expect(animate).toHaveBeenNthCalledWith(
    3,
    [
      { clipPath: 'inset(60px 0px 0px 0px round 0px)' },
      { clipPath: 'inset(132px 0px 0px 0px round 0px)' },
    ],
    expect.objectContaining({ duration: 200, fill: 'forwards' })
  );
  expect(animate).toHaveBeenNthCalledWith(
    4,
    [
      { opacity: 0.5, transform: 'translateY(2px) scale(0.97)', filter: 'blur(0px)' },
      { opacity: 0, transform: 'translateY(4px)', filter: 'blur(0px)' },
    ],
    expect.any(Object)
  );

  toggle();
  expect(getAnimation(2).onfinish).toBeNull();
  expect(getAnimation(2).cancel).toHaveBeenCalled();
  expect(animate).toHaveBeenNthCalledWith(
    6,
    [
      { opacity: 0.5, transform: 'translateY(2px) scale(0.97)', filter: 'blur(4px)' },
      { opacity: 1, transform: 'none', filter: 'blur(0px)' },
    ],
    expect.any(Object)
  );
  expect(more.inert).toBe(false);
});

test('plays the expressive version only on the first-ever expand', () => {
  window.localStorage.removeItem(FIRST_EXPAND_STORAGE_KEY);
  render(<Harness />);

  toggle();
  const [firstKeyframes, firstOptions] = animate.mock.calls[0] as unknown as [
    Keyframe[],
    KeyframeAnimationOptions
  ];
  expect(firstOptions.duration).toBe(400);
  expect(firstKeyframes.some((keyframe) => keyframe.transform === 'scale(1.03, 1.04)')).toBe(true);
  expect(window.localStorage.getItem(FIRST_EXPAND_STORAGE_KEY)).toBe('true');

  toggle();
  act(() => getAnimation(2).onfinish?.());
  toggle();
  expect(animate).toHaveBeenNthCalledWith(
    5,
    expect.any(Array),
    expect.objectContaining({ duration: 260 })
  );
});

test('changes state immediately when reduced motion is requested', () => {
  reducedMotion = true;
  render(<Harness />);
  toggle();
  expect(screen.getByTestId('more')).toBeInTheDocument();
  toggle();
  expect(screen.queryByTestId('more')).not.toBeInTheDocument();
  expect(animate).not.toHaveBeenCalled();
});

test('cancels animations and clears completion callbacks on unmount', () => {
  const { unmount } = render(<Harness />);
  toggle();
  toggle();
  const closing = getAnimation(2);
  unmount();
  expect(closing.onfinish).toBeNull();
  expect(closing.cancel).toHaveBeenCalled();
  expect(getAnimation(3).cancel).toHaveBeenCalled();
});
