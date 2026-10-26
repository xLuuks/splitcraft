import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { loadImageFile, loadImageUrl } from './imageLoader';

let image;
let originals;
beforeEach(() => {
  originals = {
    Image: window.Image,
    create: URL.createObjectURL,
    revoke: URL.revokeObjectURL,
    fetch: global.fetch,
  };
  image = { naturalWidth: 100, naturalHeight: 50, src: '' };
  window.Image = vi.fn(function () {
    return image;
  });
  URL.createObjectURL = vi.fn(() => 'blob:upload');
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  window.Image = originals.Image;
  URL.createObjectURL = originals.create;
  URL.revokeObjectURL = originals.revoke;
  global.fetch = originals.fetch;
});

it('loads a local image and releases its temporary URL', async () => {
  const file = new File(['image'], 'photo.png', { type: 'image/png' });
  const pending = loadImageFile(file);
  image.onload();
  const result = await pending;
  expect(result.data).toMatchObject({
    width: 100,
    height: 50,
    name: 'photo.png',
    type: 'image/png',
  });
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:upload');
  expect(image.onerror).toBeNull();
});

it('reports a corrupt image and releases the URL', async () => {
  const pending = loadImageFile(
    new File(['bad'], 'bad.png', { type: 'image/png' })
  );
  image.onerror();
  await expect(pending).rejects.toThrow('corrompido');
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:upload');
});

it('rejects files that are not images', async () => {
  await expect(
    loadImageFile(new File(['text'], 'file.txt', { type: 'text/plain' }))
  ).rejects.toThrow('válido');
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});

it('cancels loading and releases the temporary URL', async () => {
  const controller = new AbortController();
  const pending = loadImageFile(
    new File(['x'], 'file.png', { type: 'image/png' }),
    { signal: controller.signal }
  );
  controller.abort();
  await expect(pending).rejects.toHaveProperty('name', 'AbortError');
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:upload');
  expect(image.onload).toBeNull();
});

it('uses the response MIME type even when the URL has no extension', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    blob: async () => new Blob(['x'], { type: 'image/webp' }),
  });
  const pending = loadImageUrl('https://example.com/image');
  await new Promise((resolve) => setTimeout(resolve, 0));
  image.onload();
  expect((await pending).data.type).toBe('image/webp');
});

it('reports CORS/network and HTTP failures', async () => {
  global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
  await expect(loadImageUrl('https://example.com/image')).rejects.toThrow(
    'CORS'
  );
  global.fetch.mockResolvedValue({ ok: false, status: 404 });
  await expect(loadImageUrl('https://example.com/image')).rejects.toThrow(
    '404'
  );
  await expect(loadImageUrl('javascript:alert(1)')).rejects.toThrow('URL');
});
