"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSheet } from '@/hooks/use-sheet-store';
import { cn } from '@/lib/utils';
import type { CellStyle } from '@/lib/types';

interface CellProps {
  row: number;
  col: number;
}

export function Cell({ row, col }: CellProps) {
  const { data, activeCell, selection, dispatch, isEditing, selectedRows, selectedCols, isSheetSelected } = useSheet();
  const cellData = data[`${row}-${col}`];
  const isActive = activeCell?.row === row && activeCell?.col === col;
  const inputRef = useRef<HTMLInputElement>(null);

  const [localValue, setLocalValue] = useState(cellData?.formula || cellData?.value || '');
  
  useEffect(() => {
    setLocalValue(cellData?.formula || cellData?.value || '');
  }, [cellData?.value, cellData?.formula]);

  useEffect(() => {
    if (isActive && isEditing) {
      inputRef.current?.focus();
    }
  }, [isActive, isEditing]);


  const isSelected = () => {
    if (isSheetSelected) return true;
    if (selectedRows.has(row) || selectedCols.has(col)) return true;
    if (!selection) return false;
    
    const minRow = Math.min(selection.start.row, selection.end.row);
    const maxRow = Math.max(selection.start.row, selection.end.row);
    const minCol = Math.min(selection.start.col, selection.end.col);
    const maxCol = Math.max(selection.start.col, selection.end.col);
    
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  };

  const selected = isSelected();
  
  const handleDoubleClick = () => {
    dispatch({ type: 'START_EDITING' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };
  
  const handleInputBlur = () => {
    dispatch({ type: 'UPDATE_CELL_VALUE', payload: { row, col, value: localValue } });
    dispatch({ type: 'STOP_EDITING' });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      dispatch({ type: 'UPDATE_CELL_VALUE', payload: { row, col, value: localValue } });
      dispatch({ type: 'STOP_EDITING' });
      const nextCell = { row: row + 1, col };
      dispatch({ type: 'SET_ACTIVE_CELL', payload: nextCell });
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setLocalValue(cellData?.formula || cellData?.value || '');
      dispatch({ type: 'STOP_EDITING' });
    } else if (e.key === 'Tab') {
        e.preventDefault();
        dispatch({ type: 'UPDATE_CELL_VALUE', payload: { row, col, value: localValue } });
        dispatch({ type: 'STOP_EDITING' });
        const nextCol = e.shiftKey ? col - 1 : col + 1;
        if (nextCol >= 0) {
            dispatch({type: 'SET_ACTIVE_CELL', payload: {row, col: nextCol}});
        }
    }
  };
  
  const style: React.CSSProperties = {
    fontFamily: cellData?.style?.fontFamily || 'Inter',
    fontSize: `${cellData?.style?.fontSize || 14}px`,
    fontWeight: cellData?.style?.fontWeight || 'normal',
    fontStyle: cellData?.style?.fontStyle || 'normal',
    textDecoration: cellData?.style?.textDecoration || 'none',
    color: cellData?.style?.color || '#000000',
    backgroundColor: cellData?.style?.backgroundColor || '#FFFFFF',
    gridColumn: col + 2,
    gridRow: row + 2,
    zIndex: isActive ? 15 : (selected ? 10 : 5)
  };

  return (
    <div
      data-row={row}
      data-col={col}
      className={cn(
        "relative border-b border-r overflow-hidden whitespace-nowrap px-2 flex items-center transition-shadow",
        selected && 'bg-primary/10',
        isActive && 'shadow-[inset_0_0_0_2px_hsl(var(--primary))]'
      )}
      style={style}
      onDoubleClick={handleDoubleClick}
      tabIndex={-1}
    >
      {isActive && isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="absolute inset-0 w-full h-full p-2 outline-none border-none bg-transparent"
          style={{
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            fontStyle: style.fontStyle,
            textDecoration: style.textDecoration,
            color: style.color
          }}
        />
      ) : (
        <span>{cellData?.value}</span>
      )}
    </div>
  );
}
