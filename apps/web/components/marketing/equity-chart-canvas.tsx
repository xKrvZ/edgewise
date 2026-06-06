'use client';

import { resizeCanvas } from '@/components/marketing/canvas-utils';
import { useEffect, useRef } from 'react';

const CHART_POINTS = [28, 34, 38, 55, 47, 62, 80, 82, 96, 110];

function drawLineChart(canvas: HTMLCanvasElement, dark = true) {
  const result = resizeCanvas(canvas);
  if (!result) return;

  const { ctx, width, height } = result;
  const points = CHART_POINTS;
  const padding = 36;
  const max = Math.max(...points);
  const min = Math.min(...points);

  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < 5; i++) {
    const y = padding + i * ((height - padding * 2) / 4);
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
    ctx.stroke();
  }

  ctx.beginPath();

  points.forEach((point, i) => {
    const x = padding + i * ((width - padding * 2) / (points.length - 1));
    const y = height - padding - ((point - min) / (max - min)) * (height - padding * 2);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.strokeStyle = '#3e5dd6';
  ctx.lineWidth = 3;
  ctx.stroke();

  points.forEach((point, i) => {
    const x = padding + i * ((width - padding * 2) / (points.length - 1));
    const y = height - padding - ((point - min) / (max - min)) * (height - padding * 2);

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#a5b5f5';
    ctx.fill();
  });
}

export function EquityChartCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const draw = () => drawLineChart(canvas);
    draw();

    const observer = new ResizeObserver(draw);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <canvas ref={canvasRef} className="h-72 w-full rounded-xl bg-white/[0.03]" aria-hidden="true" />
    </div>
  );
}
