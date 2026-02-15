"use client";

import { useSheet } from '@/hooks/use-sheet-store';
import { Input } from '@/components/ui/input';
import { colToLetter } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function FormulaBar() {
  const { activeCell, data, dispatch, isEditing } = useSheet();
  const cellData = activeCell ? data[`${activeCell.row}-${activeCell.col}`] : null;

  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    if (activeCell) {
      const activeCellData = data[`${activeCell.row}-${activeCell.col}`];
      setLocalValue(activeCellData?.formula || activeCellData?.value || '');
    } else {
      setLocalValue('');
    }
  }, [activeCell, data]);


  const cellAddress = activeCell ? `${colToLetter(activeCell.col)}${activeCell.row + 1}` : '';

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    if (activeCell) {
      // We update on change so the cell editing input reflects the formula bar
      dispatch({
        type: 'UPDATE_CELL_VALUE',
        payload: { ...activeCell, value: e.target.value },
      });
    }
  };
  
  const handleFocus = () => {
    if (activeCell) {
      dispatch({ type: 'START_EDITING' });
    }
  };
  
  const handleBlur = () => {
    if(activeCell) {
        dispatch({ type: 'UPDATE_CELL_VALUE', payload: { ...activeCell, value: localValue } });
    }
    dispatch({ type: 'STOP_EDITING' });
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && activeCell) {
      e.preventDefault();
      dispatch({ type: 'UPDATE_CELL_VALUE', payload: { ...activeCell, value: localValue } });
      dispatch({ type: 'STOP_EDITING' });
      const nextCell = { row: activeCell.row + 1, col: activeCell.col };
      dispatch({ type: 'SET_ACTIVE_CELL', payload: nextCell });
    } else if (e.key === 'Escape') {
      dispatch({ type: 'STOP_EDITING' });
      // Revert value
      setLocalValue(cellData?.formula || cellData?.value || '');
    }
  };

  return (
    <div className="flex h-12 items-center gap-2 border-b bg-card px-4 shrink-0">
      <Input
        readOnly
        value={cellAddress}
        className="w-24 h-8 text-center font-mono text-sm bg-secondary border-none"
      />
      <Input
        value={localValue}
        onChange={handleValueChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-8 flex-1 font-mono text-sm"
        placeholder="fx"
      />
    </div>
  );
}
