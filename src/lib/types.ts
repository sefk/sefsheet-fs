import type React from 'react';

export interface CellStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'bold' | 'normal';
  fontStyle?: 'italic' | 'normal';
  textDecoration?: 'underline' | 'none';
  color?: string;
  backgroundColor?: string;
}

export interface CellData {
  value: string;
  formula?: string;
  style: CellStyle;
}

export interface SheetData {
  [key: string]: CellData; // key is `${rowIndex}-${colIndex}`
}

export interface Selection {
  start: { row: number; col: number };
  end: { row: number; col: number };
}

export type Action =
  | { type: 'SET_ACTIVE_CELL'; payload: { row: number; col: number } | null }
  | { type: 'START_EDITING' }
  | { type: 'STOP_EDITING' }
  | { type: 'UPDATE_CELL_VALUE'; payload: { row: number; col: number; value: string } }
  | { type: 'SET_SELECTION'; payload: Selection | null }
  | { type: 'UPDATE_SELECTION_STYLE'; payload: Partial<CellStyle> }
  | { type: 'SELECT_ALL' }
  | { type: 'SELECT_ROW'; payload: number }
  | { type: 'SELECT_COL'; payload: number }
  | { type: 'CLEAR_SELECTION_FORMATTING' };


export interface SheetState {
  data: SheetData;
  activeCell: { row: number; col: number } | null;
  selection: Selection | null;
  isEditing: boolean;
  isSheetSelected: boolean;
  selectedRows: Set<number>;
  selectedCols: Set<number>;
}

export interface SheetContextType extends SheetState {
  dispatch: React.Dispatch<Action>;
  rows: number;
  cols: number;
}
