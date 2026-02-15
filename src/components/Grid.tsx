"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSheet } from '@/hooks/use-sheet-store';
import { Cell } from '@/components/Cell';
import { colToLetter } from '@/lib/utils';
import { cn } from '@/lib/utils';

const CELL_WIDTH = 120;
const CELL_HEIGHT = 28;

export function Grid() {
  const { rows, cols, dispatch, selection, selectedRows, selectedCols, isSheetSelected } = useSheet();
  const [isSelecting, setIsSelecting] = useState(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement && e.target.closest('[data-role="grid"]')) {
      const rect = gridContainerRef.current!.getBoundingClientRect();
      const col = Math.floor((e.clientX - rect.left - 48) / CELL_WIDTH);
      const row = Math.floor((e.clientY - rect.top - 28) / CELL_HEIGHT);
      
      if (row >= 0 && col >= 0 && row < rows && col < cols) {
        setIsSelecting(true);
        if (e.shiftKey && selection) {
          dispatch({ type: 'SET_SELECTION', payload: { start: selection.start, end: { row, col } } });
        } else {
          dispatch({ type: 'SET_ACTIVE_CELL', payload: { row, col } });
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSelecting) {
      const rect = gridContainerRef.current!.getBoundingClientRect();
      const col = Math.floor((e.clientX - rect.left - 48) / CELL_WIDTH);
      const row = Math.floor((e.clientY - rect.top - 28) / CELL_HEIGHT);
      
      if (row >= 0 && col >= 0 && row < rows && col < cols) {
        if (selection) {
          dispatch({ type: 'SET_SELECTION', payload: { start: selection.start, end: { row, col } } });
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };
  
  const handleSelectAll = () => {
    dispatch({ type: 'SELECT_ALL' });
  };
  
  const handleSelectRow = (row: number) => {
    dispatch({ type: 'SELECT_ROW', payload: row });
  }

  const handleSelectCol = (col: number) => {
    dispatch({ type: 'SELECT_COL', payload: col });
  }

  return (
    <div
      ref={gridContainerRef}
      className="flex-1 overflow-auto relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      tabIndex={0}
    >
      <div 
        data-role="grid"
        className="relative grid" 
        style={{
          gridTemplateColumns: `48px repeat(${cols}, ${CELL_WIDTH}px)`,
          gridTemplateRows: `28px repeat(${rows}, ${CELL_HEIGHT}px)`,
          width: `${cols * CELL_WIDTH + 48}px`,
          height: `${rows * CELL_HEIGHT + 28}px`,
        }}
      >
        {/* Corner */}
        <div
          className={cn(
            'sticky top-0 left-0 z-30 flex items-center justify-center bg-secondary border-b border-r text-muted-foreground text-xs font-medium cursor-pointer transition-colors',
            isSheetSelected && 'bg-accent/50'
          )}
          onClick={handleSelectAll}
        ></div>

        {/* Column Headers */}
        {Array.from({ length: cols }).map((_, colIndex) => (
          <div
            key={`col-header-${colIndex}`}
            className={cn(
                'sticky top-0 z-20 flex items-center justify-center bg-secondary border-b border-r text-muted-foreground text-xs font-medium cursor-pointer transition-colors',
                selectedCols.has(colIndex) && 'bg-accent/50'
            )}
            style={{ gridColumn: colIndex + 2, gridRow: 1 }}
            onClick={() => handleSelectCol(colIndex)}
          >
            {colToLetter(colIndex)}
          </div>
        ))}

        {/* Row Headers */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-header-${rowIndex}`}
            className={cn(
                'sticky left-0 z-20 flex items-center justify-center bg-secondary border-b border-r text-muted-foreground text-xs font-medium cursor-pointer transition-colors',
                selectedRows.has(rowIndex) && 'bg-accent/50'
            )}
            style={{ gridColumn: 1, gridRow: rowIndex + 2 }}
            onClick={() => handleSelectRow(rowIndex)}
          >
            {rowIndex + 1}
          </div>
        ))}

        {/* Cells */}
        {Array.from({ length: rows }).map((_, rowIndex) =>
          Array.from({ length: cols }).map((_, colIndex) => (
            <Cell key={`${rowIndex}-${colIndex}`} row={rowIndex} col={colIndex} />
          ))
        )}
      </div>
    </div>
  );
}
