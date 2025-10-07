import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Accessibility, Sun, Moon, Type, Languages } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export function AccessibilityMenu() {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'x-large'>('normal');
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const { theme, setTheme } = useTheme();

  const handleFontSizeChange = (size: 'normal' | 'large' | 'x-large') => {
    setFontSize(size);
    const root = document.documentElement;
    
    switch (size) {
      case 'normal':
        root.style.fontSize = '16px';
        break;
      case 'large':
        root.style.fontSize = '18px';
        break;
      case 'x-large':
        root.style.fontSize = '20px';
        break;
    }
  };

  const handleLanguageChange = (lang: 'es' | 'en') => {
    setLanguage(lang);
    // TODO: Implement i18n integration
    console.log('Language changed to:', lang);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
          aria-label="Menú de accesibilidad"
        >
          <Accessibility className="h-6 w-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Accesibilidad</h3>
          
          {/* Tamaño de Fuente */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Tamaño de Letra
            </Label>
            <div className="flex gap-2">
              <Button
                variant={fontSize === 'normal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFontSizeChange('normal')}
              >
                A
              </Button>
              <Button
                variant={fontSize === 'large' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFontSizeChange('large')}
                className="text-lg"
              >
                A
              </Button>
              <Button
                variant={fontSize === 'x-large' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFontSizeChange('x-large')}
                className="text-xl"
              >
                A
              </Button>
            </div>
          </div>

          {/* Modo Oscuro/Claro */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              Tema
            </Label>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
                className="flex-1"
              >
                <Sun className="h-4 w-4 mr-2" />
                Claro
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="flex-1"
              >
                <Moon className="h-4 w-4 mr-2" />
                Oscuro
              </Button>
            </div>
          </div>

          {/* Idioma */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Idioma
            </Label>
            <div className="flex gap-2">
              <Button
                variant={language === 'es' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleLanguageChange('es')}
                className="flex-1"
              >
                Español
              </Button>
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleLanguageChange('en')}
                className="flex-1"
              >
                English
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
