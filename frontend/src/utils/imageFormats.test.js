import { expect, it } from 'vitest';
import { getExportMimeType, getFileExtension } from './imageFormats';

it('preserves encodable originals and falls back to PNG for GIF/BMP', () => {
  expect(getExportMimeType('original', 'image/jpeg')).toBe('image/jpeg');
  expect(getExportMimeType('original', 'image/gif')).toBe('image/png');
  expect(getExportMimeType('original', 'image/bmp')).toBe('image/png');
  expect(getExportMimeType('original', 'image/jpg')).toBe('image/jpeg');
  expect(getFileExtension('image/jpeg')).toBe('jpg');
});
