'use client';

import { resizeCanvas } from '@/components/marketing/canvas-utils';
import { useEffect, useRef } from 'react';

export function MarketingBackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frameId = 0;
    let t = 0;

    const render = () => {
      const result = resizeCanvas(canvas);
      if (!result) return;

      const { ctx, width, height } = result;
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(
        width * 0.75,
        height * 0.1,
        20,
        width * 0.75,
        height * 0.1,
        700,
      );

      gradient.addColorStop(0, 'rgba(62,93,214,0.16)');
      gradient.addColorStop(0.4, 'rgba(165,181,245,0.08)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.beginPath();
      for (let x = 0; x < width; x += 12) {
        const y = height * 0.22 + Math.sin(x * 0.01 + t) * 20;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.strokeStyle = 'rgba(62,93,214,0.08)';
      ctx.lineWidth = 2;
      ctx.stroke();

      t += 0.006;
      frameId = requestAnimationFrame(render);
    };

    render();

    const onResize = () => {
      t = 0;
    };

    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0">
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
    </div>
  );
}
