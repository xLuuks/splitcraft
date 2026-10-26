import { vi } from 'vitest';

global.IS_REACT_ACT_ENVIRONMENT = true;

// JSDOM does not implement layout observation used by the Radix controls.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

HTMLElement.prototype.scrollIntoView = vi.fn();
