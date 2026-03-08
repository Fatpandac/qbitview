import { useEffect, useRef } from "react";

// 0 = not downloaded (gray), 1 = downloading (amber), 2 = downloaded (blue)
const CELL = 6;
const GAP = 1;
const STEP = CELL + GAP;
const MAX_ROWS = 48;

interface PiecesCanvasProps {
  pieces: number[];
}

export function PiecesCanvas({ pieces }: PiecesCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function draw() {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !pieces.length) return;

    const width = container.clientWidth;
    const cols = Math.max(1, Math.floor(width / STEP));
    const maxCells = cols * MAX_ROWS;
    const groupSize = Math.max(1, Math.ceil(pieces.length / maxCells));
    const displayCount = Math.ceil(pieces.length / groupSize);
    const rows = Math.ceil(displayCount / cols);

    canvas.width = width;
    canvas.height = rows * STEP;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < displayCount; i++) {
      const start = i * groupSize;
      const end = Math.min(start + groupSize, pieces.length);

      let downloaded = 0;
      let downloading = 0;
      for (let j = start; j < end; j++) {
        if (pieces[j] === 2) downloaded++;
        else if (pieces[j] === 1) downloading++;
      }

      const total = end - start;
      const ratio = downloaded / total;

      let color: string;
      if (downloading > 0 && downloaded < total) {
        color = "#f59e0b"; // amber — actively downloading
      } else if (ratio === 1) {
        color = "#3b82f6"; // blue — fully downloaded
      } else if (ratio > 0) {
        // Partial: interpolate gray→blue
        const r = Math.round(55 + ratio * (59 - 55));
        const g = Math.round(65 + ratio * (130 - 65));
        const b = Math.round(81 + ratio * (246 - 81));
        color = `rgb(${r},${g},${b})`;
      } else {
        color = "#374151"; // gray — not downloaded
      }

      const col = i % cols;
      const row = Math.floor(i / cols);
      ctx.fillStyle = color;
      ctx.fillRect(col * STEP, row * STEP, CELL, CELL);
    }
  }

  useEffect(() => {
    draw();
  }, [pieces]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(draw);
    observer.observe(container);
    return () => observer.disconnect();
  }, [pieces]);

  if (!pieces.length) return null;

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
