"use client";

import { SheetProvider } from '@/hooks/use-sheet-store';
import { Toolbar } from '@/components/Toolbar';
import { FormulaBar } from '@/components/FormulaBar';
import { Grid } from '@/components/Grid';

const ROWS = 100;
const COLS = 26;

export function SefSheet() {
  return (
    <SheetProvider rows={ROWS} cols={COLS}>
      <div className="flex h-full flex-col bg-background text-foreground font-sans">
        <Toolbar />
        <FormulaBar />
        <Grid />
      </div>
    </SheetProvider>
  );
}
