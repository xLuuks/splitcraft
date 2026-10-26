import { useCallback, useEffect, useState } from 'react';
import '@/App.css';
import { Toaster } from 'sonner';
import Header from '@/components/Header';
import ImageUploader from '@/components/ImageUploader';
import CanvasPreview from '@/components/CanvasPreview';
import ControlPanel from '@/components/ControlPanel';
import ResultsGallery from '@/components/ResultsGallery';

function App() {
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [splitMode, setSplitMode] = useState('vertical');
  const [splitParams, setSplitParams] = useState({
    vertical: { count: 2, mode: 'count' },
    horizontal: { count: 2, mode: 'count' },
    grid: { rows: 2, cols: 2 },
  });
  const [exportFormat, setExportFormat] = useState('png');
  const [quality, setQuality] = useState(0.9);
  const [splitParts, setSplitParts] = useState([]);

  const revokePartUrls = useCallback((parts) => {
    parts.forEach((part) => {
      if (part?.url) {
        URL.revokeObjectURL(part.url);
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      revokePartUrls(splitParts);
    };
  }, [splitParts, revokePartUrls]);

  const handleImageLoad = (img, data) => {
    setImage(img);
    setImageData(data);
    setSplitParts([]);
  };

  const handleReset = () => {
    setImage(null);
    setImageData(null);
    setSplitParts([]);
  };

  const handleSplitComplete = (parts) => {
    setSplitParts(parts);
  };

  return (
    <div className="App min-h-screen bg-background text-foreground">
      <Header onReset={handleReset} hasImage={!!image} />

      <main className="container mx-auto p-6">
        {!image ? (
          <ImageUploader onImageLoad={handleImageLoad} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-8rem)]">
            <div className="lg:col-span-8 xl:col-span-9 min-h-[240px] sm:min-h-[320px] lg:min-h-0 bg-secondary/20 rounded-xl border border-border flex items-center justify-center relative overflow-hidden">
              <CanvasPreview
                image={image}
                imageData={imageData}
                splitMode={splitMode}
                splitParams={splitParams}
              />
            </div>

            <div className="lg:col-span-4 xl:col-span-3 lg:self-start lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] bg-card rounded-lg border border-border flex flex-col overflow-y-auto custom-scrollbar">
              <ControlPanel
                splitMode={splitMode}
                setSplitMode={setSplitMode}
                splitParams={splitParams}
                setSplitParams={setSplitParams}
                exportFormat={exportFormat}
                setExportFormat={setExportFormat}
                quality={quality}
                setQuality={setQuality}
                image={image}
                imageData={imageData}
                onSplitComplete={handleSplitComplete}
              />
            </div>
          </div>
        )}

        {splitParts.length > 0 && (
          <ResultsGallery
            parts={splitParts}
            onClear={() => setSplitParts([])}
          />
        )}
      </main>

      <footer className="container mx-auto px-6 pb-6 pt-2 text-center text-xs text-muted-foreground">
        Desenvolvido por{' '}
        <a
          href="https://github.com/xLuuks"
          target="_blank"
          rel="noreferrer"
          className="text-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          Luks Alves
        </a>
      </footer>

      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

export default App;
