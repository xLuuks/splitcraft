import { act } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import App from './App';
import { splitImage } from './utils/imageSplitter';
import { downloadFile } from './utils/downloadHelper';

vi.mock('./components/ImageUploader', () => ({
  default: function MockUploader({ onImageLoad }) {
    return (
      <button
        onClick={() =>
          onImageLoad({ width: 100, height: 100 }, { type: 'image/png' })
        }
      >
        Load test image
      </button>
    );
  },
}));
vi.mock('./components/CanvasPreview', () => ({ default: () => null }));
vi.mock('./utils/imageSplitter', async (importOriginal) => ({
  ...(await importOriginal()),
  splitImage: vi.fn(),
}));
vi.mock('./utils/downloadHelper', () => ({
  downloadFile: vi.fn(),
  downloadAllAsZip: vi.fn(),
}));
vi.mock('sonner', () => ({
  Toaster: () => null,
  toast: { success: vi.fn(), error: vi.fn() },
}));

let container;
let root;
let originalRevoke;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  originalRevoke = URL.revokeObjectURL;
  URL.revokeObjectURL = vi.fn();
  splitImage.mockReset();
  downloadFile.mockClear();
  act(() => root.render(<App />));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  URL.revokeObjectURL = originalRevoke;
  vi.unstubAllGlobals();
});

const click = async (element) => {
  await act(async () => element.click());
};
const find = (id) => container.querySelector(`[data-testid="${id}"]`);
const load = () => click(container.querySelector('button'));

it.each([false, true])(
  'reveals new results and respects reduced motion: %s',
  async (reduceMotion) => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: reduceMotion }))
    );
    const scroll = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    scroll.mockClear();
    splitImage.mockImplementation(async () => [
      {
        blob: new Blob(['x'], { type: 'image/png' }),
        url: 'blob:part',
        extension: 'png',
      },
    ]);

    await load();
    expect(scroll).not.toHaveBeenCalled();
    await click(find('split-button'));
    expect(document.activeElement).toBe(
      container.querySelector('#results-heading')
    );
    expect(scroll).toHaveBeenLastCalledWith({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });

    await click(find('split-button'));
    expect(scroll).toHaveBeenCalledTimes(2);
  }
);

it('discards an old result when reset happens during processing', async () => {
  let finish;
  splitImage.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  await load();
  await click(find('split-button'));
  const signal = splitImage.mock.calls[0][5].signal;
  await click(find('reset-button'));
  expect(signal.aborted).toBe(true);
  await act(async () =>
    finish([{ blob: new Blob(['x']), url: 'blob:stale', extension: 'png' }])
  );
  expect(find('results-gallery')).toBeNull();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:stale');
});

it('keeps the generated extension when the next export format changes', async () => {
  splitImage.mockResolvedValue([
    {
      blob: new Blob(['x'], { type: 'image/png' }),
      url: 'blob:part',
      extension: 'png',
    },
  ]);
  await load();
  await click(find('split-button'));
  const select = find('format-select');
  await act(async () => {
    select.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    );
  });
  const option = [...document.querySelectorAll('[role="option"]')].find(
    (element) => element.textContent.includes('JPEG')
  );
  await act(async () => {
    option.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    );
  });
  expect(select.textContent).toContain('JPEG');
  await click(find('download-part-0'));
  expect(downloadFile.mock.calls[0][1]).toBe('splitcraft-part-1.png');
  await click(find('clear-results-button'));
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:part');
});
