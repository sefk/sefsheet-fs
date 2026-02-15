"use client";

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';

interface ColorPickerProps {
  color?: string;
  onChange: (color: string) => void;
  children: React.ReactNode;
}

export function ColorPicker({ color, onChange, children }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleClick}
      className="relative h-9 w-9"
      aria-label="Pick a color"
    >
      {children}
      <div
        className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-5 rounded-sm"
        style={{ backgroundColor: color || 'transparent', border: '1px solid var(--border)' }}
      />
      <input
        ref={inputRef}
        type="color"
        value={color || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="absolute h-0 w-0 opacity-0"
      />
    </Button>
  );
}
