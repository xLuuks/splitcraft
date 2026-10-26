const EXTENSIONS = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export const getFileExtension = (mimeType) => {
  if (!EXTENSIONS[mimeType])
    throw new Error('Formato de imagem não suportado para exportação.');
  return EXTENSIONS[mimeType];
};

export const getExportMimeType = (format, originalType) => {
  const mimeType = format === 'original' ? originalType : `image/${format}`;
  return mimeType === 'image/jpg'
    ? 'image/jpeg'
    : EXTENSIONS[mimeType]
      ? mimeType
      : 'image/png';
};
