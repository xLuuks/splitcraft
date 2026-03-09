import { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const ImageUploader = ({ onImageLoad }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const fileInputRef = useRef(null);

  const inferMimeTypeFromUrl = (url) => {
    try {
      const pathname = new URL(url).pathname.toLowerCase();
      if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg';
      if (pathname.endsWith('.png')) return 'image/png';
      if (pathname.endsWith('.webp')) return 'image/webp';
      if (pathname.endsWith('.gif')) return 'image/gif';
      if (pathname.endsWith('.bmp')) return 'image/bmp';
      return 'image/png';
    } catch {
      return 'image/png';
    }
  };

  const loadImageFromFile = (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        onImageLoad(img, {
          width: img.width,
          height: img.height,
          size: file.size,
          name: file.name,
          type: file.type
        });
        toast.success('Imagem carregada com sucesso!');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const loadImageFromUrl = (url) => {
    if (!url.trim()) {
      toast.error('Por favor, insira uma URL válida');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      onImageLoad(img, {
        width: img.width,
        height: img.height,
        size: 0,
        name: 'image-from-url',
        type: inferMimeTypeFromUrl(url)
      });
      toast.success('Imagem carregada com sucesso!');
      setShowUrlInput(false);
      setUrlValue('');
    };
    img.onerror = () => {
      toast.error('Erro ao carregar imagem da URL. Verifique se a URL é válida e permite CORS.');
    };
    img.src = url;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      loadImageFromFile(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      loadImageFromFile(file);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 glow">
            <ImageIcon className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-4xl font-black tracking-tight">
            Divida suas imagens com precisão
          </h2>
          <p className="text-muted-foreground text-lg">
            Ferramenta 100% client-side para cortar imagens em partes verticais, horizontais ou em grade
          </p>
        </div>

        <div
          data-testid="dropzone"
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer group transition-all duration-300 ${
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-zinc-700 hover:border-primary hover:bg-primary/5'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <h3 className="text-xl font-bold mb-2">Arraste e solte sua imagem aqui</h3>
          <p className="text-muted-foreground mb-4">ou clique para selecionar um arquivo</p>
          <p className="text-sm text-muted-foreground">Suporta PNG, JPG, WEBP e outros formatos de imagem</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="file-input"
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        {!showUrlInput ? (
          <Button
            variant="outline"
            className="w-full gap-2 hover:bg-primary/10"
            onClick={() => setShowUrlInput(true)}
            data-testid="url-button"
          >
            <LinkIcon className="w-4 h-4 text-primary" />
            Carregar de URL
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Cole a URL da imagem aqui..."
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadImageFromUrl(urlValue)}
              data-testid="url-input"
              className="flex-1"
            />
            <Button
              onClick={() => loadImageFromUrl(urlValue)}
              data-testid="load-url-button"
              className="gap-2 bg-secondary hover:bg-primary/10 text-foreground border border-primary"
            >
              Carregar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowUrlInput(false);
                setUrlValue('');
              }}
              className="hover:bg-primary/10"
            >
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
