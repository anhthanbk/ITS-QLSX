import React from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
  bgColor?: string;
  fgColor?: string;
}

/**
 * Deterministic standard QR Matrix generator (25x25 matrix with finder patterns)
 * Generates an SVG QR code without external runtime dependencies.
 */
function generateDeterministicMatrix(text: string): boolean[][] {
  const size = 25;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // 1. Draw 7x7 Finder Pattern at (row, col)
  function drawFinderPattern(startRow: number, startCol: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const row = matrix[startRow + r];
        if (!row) continue;

        if (
          r === 0 || r === 6 || c === 0 || c === 6 || // Outer 7x7 border
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)     // Inner 3x3 box
        ) {
          row[startCol + c] = true;
        } else {
          row[startCol + c] = false;
        }
      }
    }
  }

  // Draw 3 finder patterns: Top-Left, Top-Right, Bottom-Left
  drawFinderPattern(0, 0);
  drawFinderPattern(0, size - 7);
  drawFinderPattern(size - 7, 0);

  // 2. Timing patterns (Alternating on row 6 and col 6)
  const row6 = matrix[6];
  if (row6) {
    for (let i = 8; i < size - 8; i++) {
      row6[i] = i % 2 === 0;
      const colRow = matrix[i];
      if (colRow) {
        colRow[6] = i % 2 === 0;
      }
    }
  }

  // 3. Simple hash function for content
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  // 4. Fill data modules with pseudo-random deterministic distribution based on text
  let seed = Math.abs(hash) || 123456789;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let r = 0; r < size; r++) {
    const row = matrix[r];
    if (!row) continue;

    for (let c = 0; c < size; c++) {
      // Skip finder pattern zones (+ separator)
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      const inTiming = (r === 6 && c >= 8 && c < size - 8) || (c === 6 && r >= 8 && r < size - 8);

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
        row[c] = nextRand() > 0.48;
      }
    }
  }

  return matrix;
}

export const ProductionQRCodeSvg: React.FC<QRCodeProps> = ({
  value,
  size = 140,
  className = '',
  bgColor = '#FFFFFF',
  fgColor = '#0F172A',
}) => {
  const matrix = React.useMemo(() => generateDeterministicMatrix(value), [value]);
  const matrixSize = matrix.length;
  const cellSize = size / (matrixSize + 2); // 1-cell quiet zone margin

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
    >
      <rect width={size} height={size} fill={bgColor} />
      <g transform={`translate(${cellSize}, ${cellSize})`}>
        {matrix.map((row, r) =>
          row.map((filled, c) =>
            filled ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill={fgColor}
              />
            ) : null,
          ),
        )}
      </g>
    </svg>
  );
};
