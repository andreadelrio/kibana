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

const Harness = () => {
  const { isMoreMounted, toggle, surfaceRef, contentRef, moreRef } = useToolbarExpandAnimation();
  return (
    <div>
      <div ref={surfaceRef} data-test-subj="surface" />
      <div ref={contentRef} data-test-subj="content">
        {isMoreMounted && <div ref={moreRef} data-test-subj="more" />}
        <button onClick={toggle}>Toggle</button>
      </div>
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
let surfaceHeight = 48;

const toggle = () => fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));

const getAnimation = (index: number): ReturnType<typeof createAnimation> =>
  animate.mock.results[index].value;

beforeEach(() => {
  surfaceHeight = 48;
  reducedMotion = false;
  animate.mockClear();
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    value: animate,
  });
  jest.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    ...originalMatchMedia(query),
    matches: reducedMotion,
  }));
  jest
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: HTMLElement) {
      const height =
        this.dataset.testSubj === 'surface'
          ? surfaceHeight
          : screen.queryByTestId('more')
          ? 180
          : 48;
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
  if (originalAnimate) {
    Object.defineProperty(HTMLElement.prototype, 'animate', originalAnimate);
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'animate');
  }
});

test('keeps exiting options inert and mounted until the surface finishes closing', () => {
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

test('reverses from current visual values and measures compact height without transforms', () => {
  render(<Harness />);
  toggle();
  const more = screen.getByTestId('more');
  more.style.opacity = '0.5';
  more.style.transform = 'translateY(2px) scale(0.97)';
  surfaceHeight = 120;
  toggle();

  expect(getAnimation(0).cancel).toHaveBeenCalled();
  expect(animate).toHaveBeenNthCalledWith(
    3,
    [
      { width: '400px', height: '120px' },
      { width: '400px', height: '48px' },
    ],
    expect.any(Object)
  );
  expect(animate).toHaveBeenNthCalledWith(
    4,
    [
      { opacity: 0.5, transform: 'translateY(2px) scale(0.97)' },
      { opacity: 0, transform: 'translateY(4px)' },
    ],
    expect.objectContaining({ delay: 0 })
  );

  toggle();
  expect(getAnimation(2).onfinish).toBeNull();
  expect(getAnimation(2).cancel).toHaveBeenCalled();
  expect(animate).toHaveBeenNthCalledWith(
    6,
    [
      { opacity: 0.5, transform: 'translateY(2px) scale(0.97)' },
      { opacity: 1, transform: 'none' },
    ],
    expect.objectContaining({ delay: 0 })
  );
  expect(more.inert).toBe(false);
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
