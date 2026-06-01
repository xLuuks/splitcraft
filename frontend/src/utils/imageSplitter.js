export const MIN_PART_SIZE = 10;
export const MAX_PARTS = 400;

const toPositiveInteger = (value, fallback, min = 1, max = Number.MAX_SAFE_INTEGER) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(Math.max(Math.floor(number), min), max);
};

const canvasToBlob = (canvas, mimeType, quality) => (
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Falha ao exportar uma das partes da imagem.'));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality
    );
  })
);

const buildSplitRegions = (width, height, mode, params) => {
  const parts = [];

  if (mode === 'vertical') {
    // Vertical = tiras verticais = divide a largura
    if (params.mode === 'count') {
      const count = toPositiveInteger(params.count, 2, 2, MAX_PARTS);
      const partWidth = Math.floor(width / count);

      for (let i = 0; i < count; i++) {
        const x = i * partWidth;
        const w = i === count - 1 ? width - x : partWidth;
        parts.push({ x, y: 0, w, h: height });
      }
    } else if (params.mode === 'size') {
      const size = toPositiveInteger(params.size, 100, MIN_PART_SIZE);
      let x = 0;

      while (x < width) {
        const w = Math.min(size, width - x);
        parts.push({ x, y: 0, w, h: height });
        x += size;
      }
    }
  } else if (mode === 'horizontal') {
    // Horizontal = tiras horizontais = divide a altura
    if (params.mode === 'count') {
      const count = toPositiveInteger(params.count, 2, 2, MAX_PARTS);
      const partHeight = Math.floor(height / count);

      for (let i = 0; i < count; i++) {
        const y = i * partHeight;
        const h = i === count - 1 ? height - y : partHeight;
        parts.push({ x: 0, y, w: width, h });
      }
    } else if (params.mode === 'size') {
      const size = toPositiveInteger(params.size, 100, MIN_PART_SIZE);
      let y = 0;

      while (y < height) {
        const h = Math.min(size, height - y);
        parts.push({ x: 0, y, w: width, h });
        y += size;
      }
    }
  } else if (mode === 'grid') {
    const rows = toPositiveInteger(params.rows, 2, 2, 20);
    const cols = toPositiveInteger(params.cols, 2, 2, 20);
    const rowHeight = Math.floor(height / rows);
    const colWidth = Math.floor(width / cols);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * colWidth;
        const y = row * rowHeight;
        const w = col === cols - 1 ? width - x : colWidth;
        const h = row === rows - 1 ? height - y : rowHeight;
        parts.push({ x, y, w, h });
      }
    }
  }

  if (parts.length > MAX_PARTS) {
    throw new Error(`A divisão geraria ${parts.length} partes. Use no máximo ${MAX_PARTS} partes por vez.`);
  }

  if (parts.some((part) => part.w < 1 || part.h < 1)) {
    throw new Error('Algumas partes ficariam menores que 1 pixel. Reduza a quantidade de partes.');
  }

  return parts;
};

export const calculateCutLines = (width, height, mode, params) => {
  const lines = [];

  if (mode === 'vertical') {
    // Vertical = tiras verticais = linhas de corte verticais (divide a largura)
    if (params.mode === 'count') {
      const count = toPositiveInteger(params.count, 2, 2, MAX_PARTS);
      const partWidth = width / count;
      for (let i = 1; i < count; i++) {
        lines.push({ type: 'vertical', position: partWidth * i });
      }
    } else if (params.mode === 'size') {
      const size = toPositiveInteger(params.size, 100, MIN_PART_SIZE);
      for (let x = size; x < width && lines.length < MAX_PARTS - 1; x += size) {
        lines.push({ type: 'vertical', position: x });
      }
    }
  } else if (mode === 'horizontal') {
    // Horizontal = tiras horizontais = linhas de corte horizontais (divide a altura)
    if (params.mode === 'count') {
      const count = toPositiveInteger(params.count, 2, 2, MAX_PARTS);
      const partHeight = height / count;
      for (let i = 1; i < count; i++) {
        lines.push({ type: 'horizontal', position: partHeight * i });
      }
    } else if (params.mode === 'size') {
      const size = toPositiveInteger(params.size, 100, MIN_PART_SIZE);
      for (let y = size; y < height && lines.length < MAX_PARTS - 1; y += size) {
        lines.push({ type: 'horizontal', position: y });
      }
    }
  } else if (mode === 'grid') {
    const rows = toPositiveInteger(params.rows, 2, 2, 20);
    const cols = toPositiveInteger(params.cols, 2, 2, 20);
    const rowHeight = height / rows;
    const colWidth = width / cols;

    for (let i = 1; i < rows; i++) {
      lines.push({ type: 'horizontal', position: rowHeight * i });
    }
    for (let i = 1; i < cols; i++) {
      lines.push({ type: 'vertical', position: colWidth * i });
    }
  }

  return lines;
};

export const splitImage = async (image, mode, params, mimeType, quality) => {
  const width = image.width;
  const height = image.height;
  const parts = buildSplitRegions(width, height, mode, params);
  const processedParts = [];

  try {
    for (const part of parts) {
      const canvas = document.createElement('canvas');
      canvas.width = part.w;
      canvas.height = part.h;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Falha ao inicializar canvas para processamento da imagem.');
      }

      ctx.drawImage(
        image,
        part.x, part.y, part.w, part.h,
        0, 0, part.w, part.h
      );

      const blob = await canvasToBlob(canvas, mimeType, quality);
      processedParts.push({
        blob,
        url: URL.createObjectURL(blob),
        width: part.w,
        height: part.h
      });

      canvas.width = 0;
      canvas.height = 0;
    }

    return processedParts;
  } catch (error) {
    processedParts.forEach((part) => URL.revokeObjectURL(part.url));
    throw error;
  }
};
