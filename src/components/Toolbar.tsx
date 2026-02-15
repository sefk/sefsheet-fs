"use client";

import { Bold, Italic, Underline, Palette, CaseSensitive, Baseline } from 'lucide-react';
import { useSheet } from '@/hooks/use-sheet-store';
import type { CellStyle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ColorPicker } from '@/components/ColorPicker';
import { cn } from '@/lib/utils';

const fontFamilies = ['Inter', 'Arial', 'Verdana', 'Times New Roman', 'Courier New'];
const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36];

export function Toolbar() {
  const { activeCell, data, dispatch, selection } = useSheet();

  const getActiveStyle = (): Partial<CellStyle> => {
    if (activeCell) {
      const cellData = data[`${activeCell.row}-${activeCell.col}`];
      return cellData?.style || {};
    }
    if(selection) {
        const cellData = data[`${selection.start.row}-${selection.start.col}`];
        return cellData?.style || {};
    }
    return {};
  };

  const activeStyle = getActiveStyle();

  const handleStyleChange = (key: keyof CellStyle, value: any) => {
    dispatch({ type: 'UPDATE_SELECTION_STYLE', payload: { [key]: value } });
  };
  
  const handleToggleStyle = (key: 'fontWeight' | 'fontStyle' | 'textDecoration', activeValue: string, inactiveValue: string) => {
    const currentValue = activeStyle[key];
    handleStyleChange(key, currentValue === activeValue ? inactiveValue : activeValue);
  };

  return (
    <div className="flex h-14 items-center gap-2 border-b bg-card px-4 shrink-0">
      <Select
        value={activeStyle.fontFamily || 'Inter'}
        onValueChange={(value) => handleStyleChange('fontFamily', value)}
      >
        <SelectTrigger className="w-40 h-9">
          <CaseSensitive className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Font" />
        </SelectTrigger>
        <SelectContent>
          {fontFamilies.map((font) => (
            <SelectItem key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(activeStyle.fontSize || 14)}
        onValueChange={(value) => handleStyleChange('fontSize', Number(value))}
      >
        <SelectTrigger className="w-24 h-9">
          <Baseline className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent>
          {fontSizes.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Separator orientation="vertical" className="h-6" />
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className={cn('h-9 w-9', activeStyle.fontWeight === 'bold' && 'bg-accent text-accent-foreground')}
          onClick={() => handleToggleStyle('fontWeight', 'bold', 'normal')}
          aria-pressed={activeStyle.fontWeight === 'bold'}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={cn('h-9 w-9', activeStyle.fontStyle === 'italic' && 'bg-accent text-accent-foreground')}
          onClick={() => handleToggleStyle('fontStyle', 'italic', 'normal')}
          aria-pressed={activeStyle.fontStyle === 'italic'}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={cn('h-9 w-9', activeStyle.textDecoration === 'underline' && 'bg-accent text-accent-foreground')}
          onClick={() => handleToggleStyle('textDecoration', 'underline', 'none')}
          aria-pressed={activeStyle.textDecoration === 'underline'}
        >
          <Underline className="h-4 w-4" />
        </Button>
      </div>
      <Separator orientation="vertical" className="h-6" />
      <div className="flex items-center gap-1">
        <ColorPicker
          color={activeStyle.backgroundColor}
          onChange={(color) => handleStyleChange('backgroundColor', color)}
        >
          <Palette className="h-5 w-5" />
        </ColorPicker>
        <ColorPicker
          color={activeStyle.color}
          onChange={(color) => handleStyleChange('color', color)}
        >
          <div className='font-bold text-lg'>A</div>
        </ColorPicker>
      </div>
    </div>
  );
}
