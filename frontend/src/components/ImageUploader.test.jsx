import { act } from 'react';
import { expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import ImageUploader from './ImageUploader';
import { loadImageFile } from '../utils/imageLoader';

vi.mock('../utils/imageLoader', () => ({
  loadImageFile: vi.fn(),
  loadImageUrl: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

it('provides a keyboard-accessible upload button and reports loading failures', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const onImageLoad = vi.fn();
  let rejectLoad;
  loadImageFile.mockImplementation(
    () =>
      new Promise((resolve, reject) => {
        rejectLoad = reject;
      })
  );
  try {
    act(() => root.render(<ImageUploader onImageLoad={onImageLoad} />));
    expect(container.querySelector('[data-testid="dropzone"]').tagName).toBe(
      'BUTTON'
    );
    const input = container.querySelector('input[type="file"]');
    Object.defineProperty(input, 'files', {
      value: [new File(['bad'], 'bad.png', { type: 'image/png' })],
    });
    await act(async () =>
      input.dispatchEvent(new Event('change', { bubbles: true }))
    );
    expect(container.querySelector('[role="status"]').textContent).toContain(
      'Carregando'
    );
    expect(container.querySelector('[data-testid="dropzone"]').disabled).toBe(
      true
    );
    await act(async () => rejectLoad(new Error('Imagem corrompida')));
    expect(container.querySelector('[role="alert"]').textContent).toBe(
      'Imagem corrompida'
    );
    expect(container.querySelector('[data-testid="dropzone"]').disabled).toBe(
      false
    );
    expect(onImageLoad).not.toHaveBeenCalled();
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
