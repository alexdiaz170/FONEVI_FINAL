import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

const FRAMER_PROPS = new Set([
  'initial',
  'animate',
  'exit',
  'transition',
  'whileHover',
  'whileTap',
  'whileFocus',
  'whileDrag',
  'whileInView',
  'variants',
  'layout',
  'layoutId',
  'onAnimationStart',
  'onAnimationComplete',
]);

function stripFramerProps(props: any) {
  const cleaned: any = {};
  for (const key of Object.keys(props)) {
    if (!FRAMER_PROPS.has(key)) {
      cleaned[key] = props[key];
    }
  }
  return cleaned;
}

vi.mock('framer-motion', () => {
  function createTag(tag: keyof JSX.IntrinsicElements) {
    return React.forwardRef(function MotionTag(props: any, ref: React.Ref<any>) {
      const { children, className, ...rest } = stripFramerProps(props);
      return React.createElement(tag, { ref, className, ...rest }, children);
    });
  }

  return {
    LazyMotion: ({ children }: any) => React.createElement(React.Fragment, null, children),
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
    m: {
      div: createTag('div'),
      button: createTag('button'),
      tr: createTag('tr'),
    },
    domAnimation: {},
  };
});
