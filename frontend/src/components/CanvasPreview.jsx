import { useEffect, useRef, useState } from 'react';
import { calculateCutLines } from '@/utils/imageSplitter';

const CanvasPreview = ({ image, imageData, splitMode, splitParams }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState(null);

  // Measure only the drawing area, keeping image details outside the canvas.
  useEffect(() => {
    if (!image || !containerRef.current) return;

    const container = containerRef.current;
    const calculateDimensions = () => {
      const containerWidth = Math.max(container.clientWidth - 40, 1);
      const containerHeight = Math.max(container.clientHeight - 40, 1);

      const scale = Math.min(
        containerWidth / image.width,
        containerHeight / image.height,
        1
      );

      setDimensions({
        scale,
        displayWidth: image.width * scale,
        displayHeight: image.height * scale,
      });
    };

    calculateDimensions();

    const observer = new ResizeObserver(calculateDimensions);
    observer.observe(container);
    window.addEventListener('resize', calculateDimensions);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', calculateDimensions);
    };
  }, [image]);

  // Desenhar imagem e linhas de corte
  useEffect(() => {
    if (!image || !canvasRef.current || !dimensions) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { scale, displayWidth, displayHeight } = dimensions;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, displayWidth, displayHeight);

    let lines = [];
    try {
      lines = calculateCutLines(
        image.width,
        image.height,
        splitMode,
        splitParams[splitMode]
      );
    } catch {
      // Invalid configurations are explained next to the split button.
    }

    const gold = getComputedStyle(canvas).getPropertyValue('--gold').trim();
    ctx.strokeStyle = gold ? `hsl(${gold})` : '#d4af37';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    lines.forEach((line) => {
      ctx.beginPath();
      if (line.type === 'vertical') {
        const x = line.position * scale;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, displayHeight);
      } else if (line.type === 'horizontal') {
        const y = line.position * scale;
        ctx.moveTo(0, y);
        ctx.lineTo(displayWidth, y);
      }
      ctx.stroke();
    });
  }, [image, dimensions, splitMode, splitParams]);

  return (
    <div
      className="w-full h-full min-h-0 flex flex-col"
      data-testid="canvas-preview"
    >
      <div
        ref={containerRef}
        className="canvas-container w-full h-[220px] sm:h-[300px] shrink-0 lg:h-auto lg:flex-1 lg:shrink min-h-0 flex items-center justify-center overflow-hidden p-4"
      >
        {image && (
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Prévia da imagem com as linhas de corte"
            className="max-w-full max-h-full rounded-lg shadow-2xl"
          />
        )}
      </div>
      {image && imageData && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border bg-card px-4 py-2 text-xs font-mono">
          <span className="text-gold">
            {imageData.width} × {imageData.height}px
          </span>
          {imageData.size > 0 && (
            <span className="text-muted-foreground">
              {(imageData.size / 1024 / 1024).toFixed(2)} MB
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CanvasPreview;
