import { useEffect, useRef, useState } from 'react';
import { calculateCutLines } from '@/utils/imageSplitter';

const CanvasPreview = ({ image, imageData, splitMode, splitParams, onCutLinesUpdate }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState(null);

  // Calcular dimensões apenas quando a imagem muda
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
        displayHeight: image.height * scale
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
    const { scale, displayWidth, displayHeight } = dimensions;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, displayWidth, displayHeight);

    const lines = calculateCutLines(
      image.width,
      image.height,
      splitMode,
      splitParams[splitMode]
    );
    onCutLinesUpdate(lines);

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    lines.forEach(line => {
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
  }, [image, dimensions, splitMode, splitParams, onCutLinesUpdate]);

  return (
    <div
      ref={containerRef}
      className="canvas-container w-full h-full flex items-center justify-center p-4"
      data-testid="canvas-preview"
    >
      {image && (
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full rounded-lg shadow-2xl"
          />
          {imageData && (
            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg text-xs font-mono space-y-1">
              <div className="text-cyan-400">
                {imageData.width} × {imageData.height}px
              </div>
              {imageData.size > 0 && (
                <div className="text-muted-foreground">
                  {(imageData.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CanvasPreview;
