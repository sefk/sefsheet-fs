"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSheet } from '@/hooks/use-sheet-store';
import { Cell } from '@/components/Cell';
import { colToLetter } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function Grid() {
  const { rows, cols, dispatch, selection, selectedRows, selectedCols, isSheetSelected, activeCell, isEditing, colWidths, rowHeights } = useSheet();
  const [isSelecting, setIsSelecting] = useState(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState<{ type: 'col' | 'row', index: number, startPos: number, startSize: number } | null>(null);

  const handleResizeStart = (e: React.MouseEvent, type: 'col' | 'row', index: number) => {
    e.stopPropagation();
    document.body.style.cursor = type === 'col' ? 'col-resize' : 'row-resize';
    if (type === 'col') {
      setResizing({ type, index, startPos: e.clientX, startSize: colWidths[index] });
    } else {
      setResizing({ type, index, startPos: e.clientY, startSize: rowHeights[index] });
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!resizing) return;
      if (resizing.type === 'col') {
        const newWidth = resizing.startSize + e.clientX - resizing.startPos;
        dispatch({ type: 'RESIZE_COL', payload: { col: resizing.index, width: newWidth } });
      } else {
        const newHeight = resizing.startSize + e.clientY - resizing.startPos;
        dispatch({ type: 'RESIZE_ROW', payload: { row: resizing.index, height: newHeight } });
      }
    };

    const handleGlobalMouseUp = () => {
      setResizing(null);
      document.body.style.cursor = '';
    };

    if (resizing) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [resizing, dispatch]);

  const getCellFromEvent = (e: React.MouseEvent<HTMLDivElement>): { row: number; col: number } | null => {
    if (!gridContainerRef.current) return null;
    const rect = gridContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 48; // 48 is row header width
    const y = e.clientY - rect.top - 28; // 28 is col header height

    if (x < 0 || y < 0) return null;

    let col = -1;
    let currentX = 0;
    for (let i = 0; i < cols; i++) {
        currentX += colWidths[i];
        if (x < currentX) {
            col = i;
            break;
        }
    }

    let row = -1;
    let currentY = 0;
    for (let i = 0; i < rows; i++) {
        currentY += rowHeights[i];
        if (y < currentY) {
            row = i;
            break;
        }
    }
    
    if (row < 0 || row >= rows || col < 0 || col >= cols) return null;

    return { row, col };
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      gridContainerRef.current?.contains(document.activeElement) &&
      document.activeElement?.tagName === 'INPUT'
    ) {
      (document.activeElement as HTMLElement).blur();
    }
    
    if (e.target instanceof HTMLElement && e.target.closest('[data-role="grid"]')) {
      const cellCoords = getCellFromEvent(e);
      if (cellCoords) {
        const { row, col } = cellCoords;
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
    if (resizing) return;
    if (isSelecting) {
      const cellCoords = getCellFromEvent(e);
      if (cellCoords) {
        const { row, col } = cellCoords;
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!activeCell || isEditing) return;

    if (e.key === 'F2' || e.key === 'Enter') {
        e.preventDefault();
        dispatch({ type: 'START_EDITING' });
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        dispatch({type: 'UPDATE_CELL_VALUE', payload: {...activeCell, value: ''}})
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        dispatch({type: 'UPDATE_CELL_VALUE', payload: {...activeCell, value: e.key}})
        dispatch({ type: 'START_EDITING' });
    }
  };

  const gridTemplateColumns = `48px ${colWidths.map(w => `${w}px`).join(' ')}`;
  const gridTemplateRows = `28px ${rowHeights.map(h => `${h}px`).join(' ')}`;
  const totalWidth = 48 + colWidths.reduce((a, b) => a + b, 0);
  const totalHeight = 28 + rowHeights.reduce((a, b) => a + b, 0);

  return (
    <div
      ref={gridContainerRef}
      className="flex-1 overflow-auto relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div 
        data-role="grid"
        className="relative grid" 
        style={{
          gridTemplateColumns,
          gridTemplateRows,
          width: `${totalWidth}px`,
          height: `${totalHeight}px`,
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
            style={{ gridColumn: colIndex + 2, gridRow: 1, position: 'relative' }}
            onClick={() => handleSelectCol(colIndex)}
          >
            {colToLetter(colIndex)}
            <div
              className="absolute top-0 right-[-2px] h-full w-1 cursor-col-resize hover:bg-primary z-10"
              onMouseDown={(e) => handleResizeStart(e, 'col', colIndex)}
            />
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
            style={{ gridColumn: 1, gridRow: rowIndex + 2, position: 'relative' }}
            onClick={() => handleSelectRow(rowIndex)}
          >
            {rowIndex + 1}
            <div
                className="absolute bottom-[-2px] left-0 w-full h-1 cursor-row-resize hover:bg-primary z-10"
                onMouseDown={(e) => handleResizeStart(e, 'row', rowIndex)}
            />
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
