import { calculateCutLines, MAX_PARTS, MIN_PART_SIZE, splitImage } from './imageSplitter';

describe('calculateCutLines', () => {
  it('calculates vertical cut lines by count', () => {
    expect(calculateCutLines(300, 120, 'vertical', { mode: 'count', count: 3 })).toEqual([
      { type: 'vertical', position: 100 },
      { type: 'vertical', position: 200 }
    ]);
  });

  it('clamps invalid fixed sizes to the minimum part size', () => {
    const lines = calculateCutLines(50, 120, 'vertical', { mode: 'size', size: -1 });

    expect(lines).toEqual([
      { type: 'vertical', position: MIN_PART_SIZE },
      { type: 'vertical', position: MIN_PART_SIZE * 2 },
      { type: 'vertical', position: MIN_PART_SIZE * 3 },
      { type: 'vertical', position: MIN_PART_SIZE * 4 }
    ]);
  });

  it('calculates grid lines', () => {
    expect(calculateCutLines(400, 300, 'grid', { rows: 3, cols: 2 })).toEqual([
      { type: 'horizontal', position: 100 },
      { type: 'horizontal', position: 200 },
      { type: 'vertical', position: 200 }
    ]);
  });
});

describe('splitImage', () => {
  const originalCreateElement = document.createElement.bind(document);

  beforeEach(() => {
    URL.createObjectURL = jest.fn((blob) => `blob:${blob.size}:${URL.createObjectURL.mock.calls.length}`);
    URL.revokeObjectURL = jest.fn();

    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName !== 'canvas') {
        return originalCreateElement(tagName);
      }

      return {
        width: 0,
        height: 0,
        getContext: jest.fn(() => ({ drawImage: jest.fn() })),
        toBlob: jest.fn((callback, mimeType) => {
          callback(new Blob(['part'], { type: mimeType }));
        })
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('splits an image sequentially and keeps the remainder in the last part', async () => {
    const parts = await splitImage(
      { width: 101, height: 20 },
      'vertical',
      { mode: 'count', count: 3 },
      'image/png',
      0.9
    );

    expect(parts).toHaveLength(3);
    expect(parts.map((part) => part.width)).toEqual([33, 33, 35]);
    expect(parts.every((part) => part.height === 20)).toBe(true);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(3);
  });

  it('rejects splits that would generate too many parts', async () => {
    await expect(
      splitImage(
        { width: (MAX_PARTS + 1) * MIN_PART_SIZE, height: 20 },
        'vertical',
        { mode: 'size', size: MIN_PART_SIZE },
        'image/png',
        0.9
      )
    ).rejects.toThrow(`Use no máximo ${MAX_PARTS} partes`);
  });
});
