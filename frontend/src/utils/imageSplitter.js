import { getFileExtension } from './imageFormats';

export const MIN_PART_SIZE = 10;
export const MAX_PARTS = 400;

const positiveInteger = (value, fallback, min, max) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(Math.max(Math.floor(number), min), max)
    : fallback;
};

const axisBoundaries = (length, params, countKey) => {
  if (params.mode === 'size') {
    const size = positiveInteger(
      params.size,
      100,
      MIN_PART_SIZE,
      Number.MAX_SAFE_INTEGER
    );
    const count = Math.ceil(length / size);
    if (count > MAX_PARTS)
      throw new Error(`Use no máximo ${MAX_PARTS} partes por vez.`);
    return Array.from({ length: count + 1 }, (_, index) =>
      Math.min(index * size, length)
    );
  }
  const count = positiveInteger(params[countKey], 2, 2, MAX_PARTS);
  if (count > length)
    throw new Error(
      'Reduza a quantidade de partes: cada parte precisa ter ao menos 1 pixel.'
    );
  const size = Math.floor(length / count);
  return Array.from({ length: count + 1 }, (_, index) =>
    index === count ? length : index * size
  );
};

export const calculateSplitLayout = (width, height, mode, params) => {
  if (
    ![width, height].every((value) => Number.isSafeInteger(value) && value > 0)
  ) {
    throw new Error('A imagem precisa ter dimensões válidas.');
  }
  if (!['vertical', 'horizontal', 'grid'].includes(mode) || !params) {
    throw new Error('Modo de divisão inválido.');
  }
  if (mode !== 'grid' && !['count', 'size'].includes(params.mode)) {
    throw new Error('Parâmetros de divisão inválidos.');
  }
  const x =
    mode === 'horizontal'
      ? [0, width]
      : axisBoundaries(
          width,
          mode === 'grid' ? { ...params, mode: 'count' } : params,
          mode === 'grid' ? 'cols' : 'count'
        );
  const y =
    mode === 'vertical'
      ? [0, height]
      : axisBoundaries(
          height,
          mode === 'grid' ? { ...params, mode: 'count' } : params,
          mode === 'grid' ? 'rows' : 'count'
        );
  if ((x.length - 1) * (y.length - 1) > MAX_PARTS) {
    throw new Error(`Use no máximo ${MAX_PARTS} partes por vez.`);
  }
  const regions = [];
  for (let row = 0; row < y.length - 1; row++) {
    for (let col = 0; col < x.length - 1; col++) {
      regions.push({
        x: x[col],
        y: y[row],
        w: x[col + 1] - x[col],
        h: y[row + 1] - y[row],
      });
    }
  }
  const lines = [
    ...y.slice(1, -1).map((position) => ({ type: 'horizontal', position })),
    ...x.slice(1, -1).map((position) => ({ type: 'vertical', position })),
  ];
  return { regions, lines };
};

export const calculateCutLines = (width, height, mode, params) =>
  calculateSplitLayout(width, height, mode, params).lines;

const checkAbort = (signal) => {
  if (signal?.aborted)
    throw new DOMException('Processamento cancelado.', 'AbortError');
};

const canvasToBlob = (canvas, mimeType, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Falha ao exportar uma das partes da imagem.'));
      },
      mimeType,
      quality
    );
  });

export const splitImage = async (
  image,
  mode,
  params,
  mimeType,
  quality,
  { signal } = {}
) => {
  checkAbort(signal);
  const { regions } = calculateSplitLayout(
    image.width,
    image.height,
    mode,
    params
  );
  const parts = [];
  const canvas = document.createElement('canvas');
  try {
    // Reuse one canvas and encode one part at a time to limit peak memory.
    for (const part of regions) {
      checkAbort(signal);
      canvas.width = part.w;
      canvas.height = part.h;
      const ctx = canvas.getContext('2d');
      if (!ctx)
        throw new Error(
          'Falha ao inicializar canvas para processamento da imagem.'
        );
      ctx.drawImage(
        image,
        part.x,
        part.y,
        part.w,
        part.h,
        0,
        0,
        part.w,
        part.h
      );
      const blob = await canvasToBlob(canvas, mimeType, quality);
      checkAbort(signal);
      const extension = getFileExtension(blob.type);
      parts.push({
        blob,
        url: URL.createObjectURL(blob),
        width: part.w,
        height: part.h,
        extension,
      });
    }
    return parts;
  } catch (error) {
    parts.forEach((part) => URL.revokeObjectURL(part.url));
    throw error;
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
};
