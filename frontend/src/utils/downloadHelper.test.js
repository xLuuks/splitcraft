import { expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import { createPartsZip, downloadFile } from './downloadHelper';

it('writes original content and per-part formats into the ZIP', async () => {
  const output = await createPartsZip([
    {
      blob: new Blob(['png-content'], { type: 'image/png' }),
      extension: 'png',
    },
    {
      blob: new Blob(['jpg-content'], { type: 'image/jpeg' }),
      extension: 'jpg',
    },
  ]);
  const archive = await JSZip.loadAsync(output);
  expect(Object.keys(archive.files)).toEqual([
    'splitcraft-part-001.png',
    'splitcraft-part-002.jpg',
  ]);
  expect(await archive.file('splitcraft-part-001.png').async('string')).toBe(
    'png-content'
  );
  expect(await archive.file('splitcraft-part-002.jpg').async('string')).toBe(
    'jpg-content'
  );
});

it('starts a download before revoking the URL and removes the temporary link', () => {
  vi.useFakeTimers();
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = vi.fn(() => 'blob:download');
  URL.revokeObjectURL = vi.fn();
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(function () {
      expect(this.download).toBe('part.png');
      expect(this.isConnected).toBe(true);
    });
  try {
    downloadFile(new Blob(['image']), 'part.png');
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a')).toBeNull();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:download');
  } finally {
    click.mockRestore();
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    vi.useRealTimers();
  }
});
