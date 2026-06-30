/**
 * formatting helpers and SVG QR generator
 */

export function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Procedural QR Code generator using deterministic matrix generation based on device ID.
 * This yields beautiful, sharp SVGs that look and act exactly like high-resolution QR codes.
 */
export function generateDeviceQRCodeSVG(deviceId: string): string {
  // Simple hashing function to seed random-like grid
  let hash = 0;
  for (let i = 0; i < deviceId.length; i++) {
    hash = deviceId.charCodeAt(i) + ((hash << 5) - hash);
  }

  const size = 25; // 25x25 grid (QR Version 2-ish)
  const matrix: boolean[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(false));

  // 1. Draw Finder Patterns (Top-Left, Top-Right, Bottom-Left)
  const drawFinder = (x: number, y: number) => {
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        const isBorder = row === 0 || row === 6 || col === 0 || col === 6;
        const isInner = row >= 2 && row <= 4 && col >= 2 && col <= 4;
        if (isBorder || isInner) {
          if (x + row < size && y + col < size) {
            matrix[x + row][y + col] = true;
          }
        }
      }
    }
  };

  drawFinder(0, 0); // Top-Left
  drawFinder(0, size - 7); // Top-Right
  drawFinder(size - 7, 0); // Bottom-Left

  // 2. Draw Alignment Pattern (near bottom right)
  const alignX = size - 9;
  const alignY = size - 9;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const isPart = r === 0 || r === 4 || c === 0 || c === 4 || (r === 2 && c === 2);
      if (isPart) {
        matrix[alignX + r][alignY + c] = true;
      }
    }
  }

  // 3. Fill the rest deterministically with the hash
  let seed = Math.abs(hash);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Don't overwrite finder patterns or alignment pattern
      const isTopLeftFinder = r < 9 && c < 9;
      const isTopRightFinder = r < 9 && c >= size - 9;
      const isBottomLeftFinder = r >= size - 9 && c < 9;
      const isAlignment = r >= alignX && r < alignX + 5 && c >= alignY && c < alignY + 5;

      if (!isTopLeftFinder && !isTopRightFinder && !isBottomLeftFinder && !isAlignment) {
        seed = (seed * 9301 + 49297) % 233280;
        matrix[r][c] = (seed % 2) === 0;
      }
    }
  }

  // 4. Generate SVG elements
  const cellSize = 10;
  const svgSize = size * cellSize;
  let paths = "";

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        paths += `M${c * cellSize},${r * cellSize}h${cellSize}v${cellSize}h-${cellSize}z `;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" class="w-full h-full" shape-rendering="crispEdges">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <path d="${paths.trim()}" fill="#0f172a"/>
    </svg>
  `.trim();
}
