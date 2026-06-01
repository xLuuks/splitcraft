import { useState } from 'react';
import { Grid3x3, Columns3, Scissors } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { splitImage } from '@/utils/imageSplitter';
import { toast } from 'sonner';

const SUPPORTED_EXPORT_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const ControlPanel = ({
  splitMode,
  setSplitMode,
  splitParams,
  setSplitParams,
  exportFormat,
  setExportFormat,
  quality,
  setQuality,
  image,
  imageData,
  cutLines,
  onSplitComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const updateParam = (mode, key, value) => {
    setSplitParams(prev => ({
      ...prev,
      [mode]: { ...prev[mode], [key]: value }
    }));
  };

  const getExportMimeType = () => {
    if (exportFormat !== 'original') {
      return `image/${exportFormat}`;
    }

    return SUPPORTED_EXPORT_TYPES.has(imageData?.type) ? imageData.type : 'image/png';
  };

  const updateFixedSize = (mode, key, value) => {
    updateParam(mode, key, Math.max(parseInt(value, 10) || 100, 10));
  };

  const handleSplit = async () => {
    if (!image) return;

    setIsProcessing(true);
    try {
      const parts = await splitImage(
        image,
        splitMode,
        splitParams[splitMode],
        getExportMimeType(),
        quality
      );
      onSplitComplete(parts);
      toast.success(`Imagem dividida em ${parts.length} partes!`);
    } catch (error) {
      toast.error('Erro ao dividir imagem: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 custom-scrollbar" data-testid="control-panel">
      <div className="space-y-2">
        <h2 className="text-xl font-black tracking-tight">Configurações</h2>
        <p className="text-sm text-muted-foreground">
          Ajuste os parâmetros de divisão e visualize em tempo real
        </p>
      </div>

      <Tabs value={splitMode} onValueChange={setSplitMode} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vertical" data-testid="tab-vertical" className="gap-2">
            <Columns3 className="w-4 h-4 sm:hidden" />
            <span className="hidden sm:inline">Vertical</span>
          </TabsTrigger>
          <TabsTrigger value="horizontal" data-testid="tab-horizontal" className="gap-2">
            <Columns3 className="w-4 h-4 rotate-90 sm:hidden" />
            <span className="hidden sm:inline">Horizontal</span>
          </TabsTrigger>
          <TabsTrigger value="grid" data-testid="tab-grid" className="gap-2">
            <Grid3x3 className="w-4 h-4 sm:hidden" />
            <span className="hidden sm:inline">Grade</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vertical" className="space-y-4 mt-4">
          <RadioGroup
            value={splitParams.vertical.mode}
            onValueChange={(val) => updateParam('vertical', 'mode', val)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="count" id="v-count" />
              <Label htmlFor="v-count">Por quantidade de partes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="size" id="v-size" />
              <Label htmlFor="v-size">Por largura fixa (px)</Label>
            </div>
          </RadioGroup>

          {splitParams.vertical.mode === 'count' ? (
            <div className="space-y-2">
              <Label>Quantidade de partes: {splitParams.vertical.count}</Label>
              <Slider
                value={[splitParams.vertical.count]}
                onValueChange={([val]) => updateParam('vertical', 'count', val)}
                min={2}
                max={20}
                step={1}
                data-testid="vertical-count-slider"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Largura de cada parte (px)</Label>
              <Input
                type="number"
                value={splitParams.vertical.size || 100}
                onChange={(e) => updateFixedSize('vertical', 'size', e.target.value)}
                min={10}
                step={1}
                data-testid="vertical-size-input"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="horizontal" className="space-y-4 mt-4">
          <RadioGroup
            value={splitParams.horizontal.mode}
            onValueChange={(val) => updateParam('horizontal', 'mode', val)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="count" id="h-count" />
              <Label htmlFor="h-count">Por quantidade de partes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="size" id="h-size" />
              <Label htmlFor="h-size">Por altura fixa (px)</Label>
            </div>
          </RadioGroup>

          {splitParams.horizontal.mode === 'count' ? (
            <div className="space-y-2">
              <Label>Quantidade de partes: {splitParams.horizontal.count}</Label>
              <Slider
                value={[splitParams.horizontal.count]}
                onValueChange={([val]) => updateParam('horizontal', 'count', val)}
                min={2}
                max={20}
                step={1}
                data-testid="horizontal-count-slider"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Altura de cada parte (px)</Label>
              <Input
                type="number"
                value={splitParams.horizontal.size || 100}
                onChange={(e) => updateFixedSize('horizontal', 'size', e.target.value)}
                min={10}
                step={1}
                data-testid="horizontal-size-input"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="grid" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Linhas: {splitParams.grid.rows}</Label>
            <Slider
              value={[splitParams.grid.rows]}
              onValueChange={([val]) => updateParam('grid', 'rows', val)}
              min={2}
              max={10}
              step={1}
              data-testid="grid-rows-slider"
            />
          </div>
          <div className="space-y-2">
            <Label>Colunas: {splitParams.grid.cols}</Label>
            <Slider
              value={[splitParams.grid.cols]}
              onValueChange={([val]) => updateParam('grid', 'cols', val)}
              min={2}
              max={10}
              step={1}
              data-testid="grid-cols-slider"
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="border-t border-border pt-6 space-y-4">
        <h3 className="font-bold text-foreground">Exportação</h3>
        
        <div className="space-y-2">
          <Label className="text-foreground">Formato</Label>
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger data-testid="format-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG (melhor qualidade)</SelectItem>
              <SelectItem value="jpeg">JPEG (menor tamanho)</SelectItem>
              <SelectItem value="webp">WEBP (moderno)</SelectItem>
              <SelectItem value="original">Manter formato original</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(exportFormat === 'jpeg' || exportFormat === 'webp') && (
          <div className="space-y-2">
            <Label className="text-foreground">Qualidade: {Math.round(quality * 100)}%</Label>
            <Slider
              value={[quality]}
              onValueChange={([val]) => setQuality(val)}
              min={0.1}
              max={1}
              step={0.05}
              data-testid="quality-slider"
            />
          </div>
        )}
      </div>

      <Button
        className="w-full gap-2 bg-secondary hover:bg-primary/10 text-foreground border border-primary"
        size="lg"
        onClick={handleSplit}
        disabled={isProcessing || !image}
        data-testid="split-button"
      >
        <Scissors className="w-5 h-5" />
        {isProcessing ? 'Processando...' : 'Dividir Imagem'}
      </Button>

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>Linhas de corte: {cutLines.length}</p>
        <p className="text-cyan-400">Processamento 100% local</p>
      </div>
    </div>
  );
};

export default ControlPanel;
