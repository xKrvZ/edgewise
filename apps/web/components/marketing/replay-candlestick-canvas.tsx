'use client';

import { drawRoundRect, resizeCanvas } from '@/components/marketing/canvas-utils';
import { useEffect, useRef } from 'react';

function pseudoRandom(index: number, seed: number) {
  const x = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function drawReplay(canvas: HTMLCanvasElement) {
  const result = resizeCanvas(canvas);
  if (!result) return;

  const { ctx, width, height } = result;

  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < 60; i++) {
    const x = 30 + i * ((width - 60) / 60);
    const open = height / 2 + Math.sin(i * 0.45) * 35 + pseudoRandom(i, 1) * 20;
    const close = open + (pseudoRandom(i, 2) - 0.45) * 40;
    const high = Math.min(open, close) - pseudoRandom(i, 3) * 25;
    const low = Math.max(open, close) + pseudoRandom(i, 4) * 25;

    ctx.strokeStyle = close < open ? '#22c55e' : '#ef4444';
    ctx.fillStyle = ctx.strokeStyle;

    ctx.beginPath();
    ctx.moveTo(x, high);
    ctx.lineTo(x, low);
    ctx.stroke();

    ctx.fillRect(x - 3, Math.min(open, close), 6, Math.abs(close - open) || 2);
  }

  const label = (text: string, x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    drawRoundRect(ctx, x, y, 70, 26, 8);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = '12px sans-serif';
    ctx.fillText(text, x + 14, y + 17);
  };

  label('Entry', width * 0.36, height * 0.34, '#22c55e');
  label('Note', width * 0.56, height * 0.58, '#3e5dd6');
  label('Exit', width * 0.76, height * 0.28, '#ef4444');
}

export function ReplayCandlestickCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const draw = () => drawReplay(canvas);
    draw();

    const observer = new ResizeObserver(draw);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <canvas ref={canvasRef} className="h-80 w-full rounded-xl bg-white/[0.03]" aria-hidden="true" />
    </div>
  );
}
