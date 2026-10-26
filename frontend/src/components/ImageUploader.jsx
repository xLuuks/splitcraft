import { useEffect, useRef, useState } from 'react';
import {
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  LoaderCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loadImageFile, loadImageUrl } from '@/utils/imageLoader';
import { toast } from 'sonner';

const ImageUploader = ({ onImageLoad }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const operationRef = useRef(null);

  useEffect(() => () => operationRef.current?.abort(), []);

  const cancelLoad = () => {
    operationRef.current?.abort();
    operationRef.current = null;
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadImage = async (source, fromUrl = false) => {
    if (operationRef.current) return;
    const controller = new AbortController();
    operationRef.current = controller;
    setIsLoading(true);
    setError('');
    try {
      const loader = fromUrl ? loadImageUrl : loadImageFile;
      const { image, data } = await loader(source, {
        signal: controller.signal,
      });
      if (!controller.signal.aborted) {
        toast.success('Imagem carregada com sucesso!');
        onImageLoad(image, data);
      }
    } catch (loadError) {
      if (!controller.signal.aborted) setError(loadError.message);
    } finally {
      if (!controller.signal.aborted) {
        operationRef.current = null;
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-[70vh]"
      aria-busy={isLoading}
    >
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 glow">
            <ImageIcon className="w-10 h-10 text-gold" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black">
            Divida suas imagens com precisão
          </h2>
          <p className="text-muted-foreground text-lg">
            Cortes verticais, horizontais ou em grade
          </p>
        </div>

        <button
          type="button"
          data-testid="dropzone"
          disabled={isLoading}
          className={`w-full border-2 border-dashed rounded-lg p-6 sm:p-12 text-center group transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary hover:bg-primary/5'
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            const file = event.dataTransfer.files[0];
            if (file && !isLoading) loadImage(file);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground group-hover:text-gold" />
          <span className="block text-xl font-bold mb-2">
            Arraste e solte sua imagem aqui
          </span>
          <span className="block text-muted-foreground mb-4">
            ou selecione um arquivo
          </span>
          <span className="block text-sm text-muted-foreground">
            PNG, JPG, WEBP e outros formatos de imagem
          </span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          disabled={isLoading}
          onChange={(event) => {
            if (event.target.files[0]) loadImage(event.target.files[0]);
          }}
          className="hidden"
          aria-label="Arquivo de imagem"
          data-testid="file-input"
        />

        {isLoading && (
          <p
            role="status"
            className="flex flex-wrap items-center justify-center gap-2 text-sm"
          >
            <LoaderCircle className="w-4 h-4 animate-spin" />
            Carregando imagem...
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cancelLoad}
            >
              Cancelar
            </Button>
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        {!showUrlInput ? (
          <Button
            variant="outline"
            className="w-full gap-2 hover:bg-primary/10"
            disabled={isLoading}
            onClick={() => setShowUrlInput(true)}
            data-testid="url-button"
          >
            <LinkIcon className="w-4 h-4 text-gold" />
            Carregar de URL
          </Button>
        ) : (
          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              loadImage(urlValue, true);
            }}
          >
            <Label htmlFor="image-url">URL da imagem</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="image-url"
                type="url"
                required
                placeholder="https://..."
                value={urlValue}
                disabled={isLoading}
                onChange={(event) => setUrlValue(event.target.value)}
                data-testid="url-input"
                className="flex-1 min-w-0 basis-full sm:basis-0"
              />
              <Button
                type="submit"
                disabled={isLoading}
                data-testid="load-url-button"
              >
                Carregar
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => {
                  setShowUrlInput(false);
                  setUrlValue('');
                  setError('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
