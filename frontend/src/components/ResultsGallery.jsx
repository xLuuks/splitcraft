import { Download, FileArchive, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadFile, downloadAllAsZip } from '@/utils/downloadHelper';
import { toast } from 'sonner';
import { useEffect, useRef, useState } from 'react';

const ResultsGallery = ({ parts, onClear }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const headingRef = useRef(null);

  useEffect(() => {
    if (!parts.length || !headingRef.current) return;

    const reduceMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    headingRef.current.focus({ preventScroll: true });
    headingRef.current.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [parts]);

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    try {
      await downloadAllAsZip(parts);
      toast.success('Download iniciado!');
    } catch (error) {
      toast.error('Erro ao baixar arquivos: ' + error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSingle = (part, index) => {
    try {
      downloadFile(part.blob, `splitcraft-part-${index + 1}.${part.extension}`);
      toast.success(`Parte ${index + 1} baixada!`);
    } catch {
      toast.error('Erro ao baixar arquivo');
    }
  };

  return (
    <section
      className="mt-8 border-t border-border pt-6"
      aria-labelledby="results-heading"
      data-testid="results-gallery"
    >
      <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
        <div>
          <h2
            ref={headingRef}
            id="results-heading"
            tabIndex={-1}
            className="text-xl font-black scroll-mt-40 sm:scroll-mt-24 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Resultado
          </h2>
          <p className="text-sm text-muted-foreground">
            {parts.length}{' '}
            {parts.length === 1 ? 'parte gerada' : 'partes geradas'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleDownloadAll}
            disabled={isDownloading}
            data-testid="download-all-button"
            className="gap-2 bg-secondary hover:bg-primary/10 text-foreground border border-primary"
          >
            <FileArchive className="w-4 h-4" />
            {isDownloading ? 'Preparando...' : 'Baixar ZIP'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Limpar resultados"
            title="Limpar resultados"
            onClick={onClear}
            data-testid="clear-results-button"
            className="hover:bg-primary/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="results-grid">
        {parts.map((part, index) => (
          <div
            key={index}
            className="group relative bg-secondary rounded-lg overflow-hidden border border-border hover:border-primary transition-all duration-300"
            data-testid={`result-part-${index}`}
          >
            <div className="h-56 sm:h-64 lg:h-72 flex items-center justify-center p-3 canvas-container">
              <img
                src={part.url}
                alt={`Parte ${index + 1}`}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Parte {index + 1}</p>
              <Button
                size="sm"
                aria-label={`Baixar parte ${index + 1}`}
                onClick={() => handleDownloadSingle(part, index)}
                data-testid={`download-part-${index}`}
                className="gap-2 bg-secondary hover:bg-primary/10 text-foreground border border-primary"
              >
                <Download className="w-3 h-3" />
                Baixar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ResultsGallery;
