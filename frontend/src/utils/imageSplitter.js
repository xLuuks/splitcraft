export const calculateCutLines = (width, height, mode, params) => {
  const lines = [];

  if (mode === 'vertical') {
    // Vertical = tiras verticais = linhas de corte verticais (divide a largura)
    if (params.mode === 'count') {
      const partWidth = width / params.count;
      for (let i = 1; i < params.count; i++) {
        lines.push({ type: 'vertical', position: partWidth * i });
      }
    } else if (params.mode === 'size') {
      const size = params.size || 100;
      for (let x = size; x < width; x += size) {
        lines.push({ type: 'vertical', position: x });
      }
    }
  } else if (mode === 'horizontal') {
    // Horizontal = tiras horizontais = linhas de corte horizontais (divide a altura)
    if (params.mode === 'count') {
      const partHeight = height / params.count;
      for (let i = 1; i < params.count; i++) {
        lines.push({ type: 'horizontal', position: partHeight * i });
      }
    } else if (params.mode === 'size') {
      const size = params.size || 100;
      for (let y = size; y < height; y += size) {
        lines.push({ type: 'horizontal', position: y });
      }
    }
  } else if (mode === 'grid') {
    const rowHeight = height / params.rows;
    const colWidth = width / params.cols;

    for (let i = 1; i < params.rows; i++) {
      lines.push({ type: 'horizontal', position: rowHeight * i });
    }
    for (let i = 1; i < params.cols; i++) {
      lines.push({ type: 'vertical', position: colWidth * i });
    }
  }

  return lines;
};

export const splitImage = async (image, mode, params, mimeType, quality) => {
  return new Promise((resolve, reject) => {
    try {
      const parts = [];
      const width = image.width;
      const height = image.height;

      if (mode === 'vertical') {
        // Vertical = tiras verticais = divide a largura
        if (params.mode === 'count') {
          const partWidth = Math.floor(width / params.count);
          for (let i = 0; i < params.count; i++) {
            const x = i * partWidth;
            const w = i === params.count - 1 ? width - x : partWidth;
            parts.push({ x, y: 0, w, h: height });
          }
        } else if (params.mode === 'size') {
          const size = params.size || 100;
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
          const partHeight = Math.floor(height / params.count);
          for (let i = 0; i < params.count; i++) {
            const y = i * partHeight;
            const h = i === params.count - 1 ? height - y : partHeight;
            parts.push({ x: 0, y, w: width, h });
          }
        } else if (params.mode === 'size') {
          const size = params.size || 100;
          let y = 0;
          while (y < height) {
            const h = Math.min(size, height - y);
            parts.push({ x: 0, y, w: width, h });
            y += size;
          }
        }
      } else if (mode === 'grid') {
        const rowHeight = Math.floor(height / params.rows);
        const colWidth = Math.floor(width / params.cols);

        for (let row = 0; row < params.rows; row++) {
          for (let col = 0; col < params.cols; col++) {
            const x = col * colWidth;
            const y = row * rowHeight;
            const w = col === params.cols - 1 ? width - x : colWidth;
            const h = row === params.rows - 1 ? height - y : rowHeight;
            parts.push({ x, y, w, h });
          }
        }
      }

      if (parts.length === 0) {
        resolve([]);
        return;
      }

      const processedParts = [];
      let processed = 0;
      let hasFailed = false;

      parts.forEach((part, index) => {
        const canvas = document.createElement('canvas');
        canvas.width = part.w;
        canvas.height = part.h;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          hasFailed = true;
          reject(new Error('Falha ao inicializar canvas para processamento da imagem.'));
          return;
        }

        ctx.drawImage(
          image,
          part.x, part.y, part.w, part.h,
          0, 0, part.w, part.h
        );

        canvas.toBlob(
          (blob) => {
            if (hasFailed) return;
            if (!blob) {
              hasFailed = true;
              reject(new Error('Falha ao exportar uma das partes da imagem.'));
              return;
            }

            processedParts[index] = {
              blob,
              url: URL.createObjectURL(blob),
              width: part.w,
              height: part.h
            };
            processed++;

            if (processed === parts.length) {
              resolve(processedParts);
            }
          },
          mimeType,
          quality
        );
      });
    } catch (error) {
      reject(error);
    }
  });
};
