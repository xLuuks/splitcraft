import { Scissors, RotateCcw, Split } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = ({ onReset, hasImage }) => {
  return (
    <header className="bg-background/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Split className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight gradient-text">
            SplitCraft
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {hasImage && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              data-testid="reset-button"
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Nova Imagem
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
