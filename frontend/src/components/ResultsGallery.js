import { Download, FileArchive, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadFile, downloadAllAsZip } from '@/utils/downloadHelper';
import { toast } from 'sonner';
import { useState } from 'react';

const ResultsGallery = ({ parts, exportFormat, fileExtension, onClear }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    try {
      await downloadAllAsZip(parts, fileExtension);
      toast.success('Download iniciado!');
    } catch (error) {
      toast.error('Erro ao baixar arquivos: ' + error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSingle = (part, index) => {
    try {
      downloadFile(part.blob, `splitcraft-part-${index + 1}.${fileExtension}`);
      toast.success(`Parte ${index + 1} baixada!`);
    } catch (error) {
      toast.error('Erro ao baixar arquivo');
    }
  };

  return (
    <div className="mt-8 bg-card rounded-xl border border-border p-6" data-testid="results-gallery">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Resultado</h2>
          <p className="text-sm text-muted-foreground">
            {parts.length} {parts.length === 1 ? 'parte gerada' : 'partes geradas'}
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
            onClick={onClear}
            data-testid="clear-results-button"
            className="hover:bg-primary/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {parts.map((part, index) => (
          <div
            key={index}
            className="group relative bg-secondary rounded-lg overflow-hidden border border-border hover:border-primary transition-all duration-300"
            data-testid={`result-part-${index}`}
          >
            <div className="aspect-square flex items-center justify-center p-2 canvas-container">
              <img
                src={part.url}
                alt={`Parte ${index + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <Button
                size="sm"
                onClick={() => handleDownloadSingle(part, index)}
                data-testid={`download-part-${index}`}
                className="gap-2 bg-secondary hover:bg-primary/10 text-foreground border border-primary"
              >
                <Download className="w-3 h-3" />
                Baixar
              </Button>
              <p className="text-xs text-muted-foreground">
                Parte {index + 1}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsGallery;
