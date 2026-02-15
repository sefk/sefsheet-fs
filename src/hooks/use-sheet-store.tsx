"use client";

import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type { SheetState, SheetContextType, Action, CellData, CellStyle, SheetData } from '@/lib/types';
import { evaluateFormula } from '@/lib/formula-parser';

const SheetContext = createContext<SheetContextType | undefined>(undefined);

const defaultCellStyle: CellStyle = {
  fontFamily: 'Inter',
  fontSize: 14,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  color: '#000000',
  backgroundColor: '#FFFFFF',
};

function getInitialData(rows: number, cols: number): { [key: string]: CellData } {
  const data: { [key: string]: CellData } = {};
  return data;
}

const initialState: SheetState = {
  data: {},
  activeCell: { row: 0, col: 0 },
  selection: { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
  isEditing: false,
  isSheetSelected: false,
  selectedRows: new Set(),
  selectedCols: new Set(),
};

function recalculateSheet(data: SheetData, rows: number, cols: number): SheetData {
  const newData = JSON.parse(JSON.stringify(data));
  let changed;
  const maxIterations = 10;
  let iteration = 0;

  do {
    changed = false;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${r}-${c}`;
        if (newData[key]?.formula) {
          const formula = newData[key].formula!;
          const oldValue = newData[key].value;
          const newValue = evaluateFormula(formula, newData);
          if (newValue !== oldValue) {
            newData[key].value = newValue;
            changed = true;
          }
        }
      }
    }
    iteration++;
  } while (changed && iteration < maxIterations);

  if (iteration === maxIterations) {
    console.warn("Recalculation limit reached, possible circular dependency.");
  }

  return newData;
}


function sheetReducer(state: SheetState, action: Action, rows: number, cols: number): SheetState {
  switch (action.type) {
    case 'SET_ACTIVE_CELL':
      if (!action.payload) return { ...state, activeCell: null, selection: null };
      return {
        ...state,
        activeCell: action.payload,
        selection: { start: action.payload, end: action.payload },
        isEditing: false,
        isSheetSelected: false,
        selectedRows: new Set(),
        selectedCols: new Set(),
      };
    
    case 'START_EDITING':
      return { ...state, isEditing: true };

    case 'STOP_EDITING':
      return { ...state, isEditing: false };

    case 'UPDATE_CELL_VALUE': {
      const { row, col, value } = action.payload;
      const key = `${row}-${col}`;
      const newData = { ...state.data };
      const currentCell = newData[key] || { style: { ...defaultCellStyle } };

      if (value.startsWith('=')) {
        newData[key] = { ...currentCell, formula: value };
      } else {
        newData[key] = { ...currentCell, value, formula: undefined };
      }
      
      const calculatedData = recalculateSheet(newData, rows, cols);
      return { ...state, data: calculatedData };
    }

    case 'SET_SELECTION':
      return {
        ...state,
        selection: action.payload,
        isSheetSelected: false,
        selectedRows: new Set(),
        selectedCols: new Set(),
      };
    
    case 'SELECT_ALL':
      return {
        ...state,
        isSheetSelected: true,
        activeCell: { row: 0, col: 0 },
        selection: null,
        selectedRows: new Set(),
        selectedCols: new Set(),
      };

    case 'SELECT_ROW':
      const newSelectedRows = new Set(state.selectedRows);
      if (newSelectedRows.has(action.payload)) {
        newSelectedRows.delete(action.payload);
      } else {
        newSelectedRows.add(action.payload);
      }
      return {
        ...state,
        selectedRows: newSelectedRows,
        selectedCols: new Set(),
        isSheetSelected: false,
        selection: null,
        activeCell: null
      };

    case 'SELECT_COL':
      const newSelectedCols = new Set(state.selectedCols);
      if (newSelectedCols.has(action.payload)) {
        newSelectedCols.delete(action.payload);
      } else {
        newSelectedCols.add(action.payload);
      }
      return {
        ...state,
        selectedCols: newSelectedCols,
        selectedRows: new Set(),
        isSheetSelected: false,
        selection: null,
        activeCell: null
      };

    case 'UPDATE_SELECTION_STYLE': {
      const newData = { ...state.data };
      const styleChanges = action.payload;

      const applyStyle = (row: number, col: number) => {
        const key = `${row}-${col}`;
        const existingCell = newData[key] || { value: '', style: { ...defaultCellStyle } };
        newData[key] = {
          ...existingCell,
          style: { ...existingCell.style, ...styleChanges },
        };
      };

      if (state.isSheetSelected) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            applyStyle(r, c);
          }
        }
      } else if (state.selectedRows.size > 0) {
        state.selectedRows.forEach(row => {
          for (let c = 0; c < cols; c++) {
            applyStyle(row, c);
          }
        });
      } else if (state.selectedCols.size > 0) {
        state.selectedCols.forEach(col => {
          for (let r = 0; r < rows; r++) {
            applyStyle(r, col);
          }
        });
      } else if (state.selection) {
        const { start, end } = state.selection;
        const minRow = Math.min(start.row, end.row);
        const maxRow = Math.max(start.row, end.row);
        const minCol = Math.min(start.col, end.col);
        const maxCol = Math.max(start.col, end.col);
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            applyStyle(r, c);
          }
        }
      }
      return { ...state, data: newData };
    }
    
    default:
      return state;
  }
}

export function SheetProvider({ children, rows, cols }: { children: React.ReactNode; rows: number; cols: number }) {
  const reducerWithSheetSize = (state: SheetState, action: Action) => sheetReducer(state, action, rows, cols);
  
  const [state, dispatch] = useReducer(reducerWithSheetSize, {
    ...initialState,
    data: getInitialData(rows, cols),
  });

  const contextValue = useMemo(() => ({
    ...state,
    dispatch,
    rows,
    cols,
  }), [state, rows, cols]);

  return (
    <SheetContext.Provider value={contextValue}>
      {children}
    </SheetContext.Provider>
  );
}

export function useSheet() {
  const context = useContext(SheetContext);
  if (context === undefined) {
    throw new Error('useSheet must be used within a SheetProvider');
  }
  return context;
}
