import type { SheetData } from '@/lib/types';

function cellRefToCoords(ref: string): { row: number; col: number } | null {
  const match = ref.match(/^([A-Z]+)([0-9]+)$/i);
  if (!match) return null;
  
  const colStr = match[1].toUpperCase();
  const rowStr = match[2];
  
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 65 + 1);
  }
  col -= 1;
  
  const row = parseInt(rowStr, 10) - 1;
  
  if (col < 0 || row < 0) return null;

  return { row, col };
}

function getValue(data: SheetData, row: number, col: number): number {
    const key = `${row}-${col}`;
    const cell = data[key];

    if (!cell) return 0;

    // If the cell we are getting a value from has a formula, and its value is #ERROR! or empty,
    // we should not try to parse it as a number.
    if (cell.formula) {
        const val = parseFloat(cell.value);
        return isNaN(val) ? 0 : val;
    }
    
    return parseFloat(cell?.value) || 0;
}

function parseSum(range: string, data: SheetData): number {
    const [startRef, endRef] = range.split(':');
    const start = cellRefToCoords(startRef);
    const end = cellRefToCoords(endRef);

    if (!start || !end) return 0;

    let sum = 0;
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);

    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            sum += getValue(data, r, c);
        }
    }
    return sum;
}

export function evaluateFormula(formula: string, data: SheetData): string {
  if (!formula || !formula.startsWith('=')) {
    return formula;
  }

  let expression = formula.substring(1);

  // Handle SUM() function
  expression = expression.replace(/SUM\(([^)]+)\)/gi, (match, range) => {
    return String(parseSum(range, data));
  });

  // Replace cell references with their values
  expression = expression.replace(/[A-Z]+[0-9]+/gi, (match) => {
    const coords = cellRefToCoords(match);
    if (coords) {
      return String(getValue(data, coords.row, coords.col));
    }
    return '0'; // Invalid reference
  });

  try {
    // A simple sanitization, allows numbers, basic operators, and parenthesis.
    const sanitizedExpression = expression.replace(/[^-()\d/*+.]/g, '');
    if (sanitizedExpression === '') return '#ERROR!';

    const result = new Function('return ' + sanitizedExpression)();
    
    if (typeof result === 'number' && !isNaN(result)) {
        return String(result);
    }
    return '#VALUE!';
  } catch (error) {
    return '#ERROR!';
  }
}
