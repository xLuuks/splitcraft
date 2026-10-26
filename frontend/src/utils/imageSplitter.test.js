import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateCutLines,
  calculateSplitLayout,
  MAX_PARTS,
  splitImage,
} from './imageSplitter';

describe('split layout', () => {
  it.each([
    ['vertical', { mode: 'count', count: 3 }, 3],
    ['horizontal', { mode: 'count', count: 3 }, 3],
    ['grid', { rows: 3, cols: 4 }, 12],
    ['vertical', { mode: 'size', size: 30 }, 4],
    ['horizontal', { mode: 'size', size: 30 }, 3],
  ])('covers every pixel once for %s with %j', (mode, params, count) => {
    const { regions } = calculateSplitLayout(101, 83, mode, params);
    expect(regions).toHaveLength(count);
    const pixels = new Set();
    regions.forEach(({ x, y, w, h }) => {
      expect(w).toBeGreaterThan(0);
      expect(h).toBeGreaterThan(0);
      for (let row = y; row < y + h; row++) {
        for (let col = x; col < x + w; col++) {
          const pixel = `${col},${row}`;
          expect(pixels.has(pixel)).toBe(false);
          pixels.add(pixel);
        }
      }
    });
    expect(pixels.size).toBe(101 * 83);
  });

  it('uses the actual pixel boundaries in the preview', () => {
    expect(
      calculateCutLines(101, 20, 'vertical', { mode: 'count', count: 3 })
    ).toEqual([
      { type: 'vertical', position: 33 },
      { type: 'vertical', position: 66 },
    ]);
    const { regions, lines } = calculateSplitLayout(101, 83, 'grid', {
      rows: 3,
      cols: 4,
    });
    expect(
      lines
        .filter((line) => line.type === 'vertical')
        .map((line) => line.position)
    ).toEqual([...new Set(regions.map((part) => part.x))].slice(1));
    expect(
      lines
        .filter((line) => line.type === 'horizontal')
        .map((line) => line.position)
    ).toEqual([...new Set(regions.map((part) => part.y))].slice(1));
  });

  it('rejects too many parts before constructing regions', () => {
    expect(() =>
      calculateSplitLayout((MAX_PARTS + 1) * 10, 20, 'vertical', {
        mode: 'size',
        size: 10,
      })
    ).toThrow('400');
    expect(() =>
      calculateSplitLayout(100, 100, 'grid', { rows: 21, cols: 20 })
    ).toThrow('400');
  });

  it('rejects zero-sized parts and invalid dimensions', () => {
    expect(() =>
      calculateSplitLayout(1, 20, 'vertical', { mode: 'count', count: 2 })
    ).toThrow('1 pixel');
    expect(() =>
      calculateSplitLayout(0, 20, 'grid', { rows: 2, cols: 2 })
    ).toThrow('dimensões');
  });

  it('normalizes negative fixed sizes', () => {
    expect(
      calculateCutLines(30, 20, 'vertical', { mode: 'size', size: -5 })
    ).toHaveLength(2);
  });
});

describe('split export', () => {
  const createElement = document.createElement.bind(document);
  let canvas;
  let callbacks;
  let originalCreateUrl;
  let originalRevokeUrl;

  beforeEach(() => {
    originalCreateUrl = URL.createObjectURL;
    originalRevokeUrl = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(
      () => `blob:${URL.createObjectURL.mock.calls.length}`
    );
    URL.revokeObjectURL = vi.fn();
    callbacks = [];
    canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage: vi.fn() })),
      toBlob: vi.fn((callback) => callbacks.push(callback)),
    };
    vi.spyOn(document, 'createElement').mockImplementation((tag) =>
      tag === 'canvas' ? canvas : createElement(tag)
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    URL.createObjectURL = originalCreateUrl;
    URL.revokeObjectURL = originalRevokeUrl;
  });

  const startSplit = (signal) =>
    splitImage(
      { width: 101, height: 20 },
      'vertical',
      { mode: 'count', count: 3 },
      'image/webp',
      0.9,
      { signal }
    );

  it('waits for each encoder callback and uses the actual blob format', async () => {
    const pending = startSplit();
    expect(canvas.toBlob).toHaveBeenCalledTimes(1);
    callbacks.shift()(new Blob(['one'], { type: 'image/png' }));
    await Promise.resolve();
    expect(canvas.toBlob).toHaveBeenCalledTimes(2);
    callbacks.shift()(new Blob(['two'], { type: 'image/png' }));
    await Promise.resolve();
    callbacks.shift()(new Blob(['three'], { type: 'image/png' }));
    const parts = await pending;
    expect(parts.map((part) => part.width)).toEqual([33, 33, 35]);
    expect(parts.map((part) => part.extension)).toEqual(['png', 'png', 'png']);
    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
  });

  it('releases generated URLs and the canvas on encoding failure', async () => {
    const pending = startSplit();
    callbacks.shift()(new Blob(['one'], { type: 'image/png' }));
    await Promise.resolve();
    callbacks.shift()(null);
    await expect(pending).rejects.toThrow('exportar');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:1');
    expect(canvas.width).toBe(0);
  });

  it('discards a pending encoded blob after cancellation', async () => {
    const controller = new AbortController();
    const pending = startSplit(controller.signal);
    callbacks.shift()(new Blob(['one'], { type: 'image/png' }));
    await Promise.resolve();
    controller.abort();
    callbacks.shift()(new Blob(['two'], { type: 'image/png' }));
    await expect(pending).rejects.toHaveProperty('name', 'AbortError');
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:1');
    expect(canvas.toBlob).toHaveBeenCalledTimes(2);
  });

  it('rejects when canvas initialization fails', async () => {
    canvas.getContext.mockReturnValue(null);
    await expect(startSplit()).rejects.toThrow('inicializar');
    expect(canvas.width).toBe(0);
  });
});
