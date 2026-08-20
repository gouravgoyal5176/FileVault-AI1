import React, { useEffect, useRef } from 'react';

export const MindVisualHero: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const isMobile = width < 768;
    const particleCount = isMobile ? 24 : 45;

    // Particle / Synapse Node structure
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseAlpha: number;
      color: string;
    }

    const colors = ['#6366f1', '#8b5cf6', '#14b8a6', '#3b82f6'];

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (isMobile ? 0.4 : 0.8),
        vy: (Math.random() - 0.5) * (isMobile ? 0.4 : 0.8),
        radius: Math.random() * 2.5 + 1.5,
        baseAlpha: Math.random() * 0.5 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Mouse tracking for interactive glow
    let mouse = { x: width / 2, y: height / 2, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    if (!isMobile) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseleave', handleMouseLeave);
    }

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    let wavePhase = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw flowing brainwave frequency curves in background
      wavePhase += prefersReducedMotion ? 0.002 : 0.015;

      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const strokeColors = [
          'rgba(99, 102, 241, 0.18)',
          'rgba(139, 92, 246, 0.15)',
          'rgba(20, 184, 166, 0.12)',
        ];
        ctx.strokeStyle = strokeColors[i];

        const amplitude = 25 + i * 15;
        const frequency = 0.008 - i * 0.002;
        const yOffset = height * 0.45 + i * 30;

        for (let x = 0; x < width; x += 5) {
          const y = yOffset + Math.sin(x * frequency + wavePhase + i) * amplitude;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // 2. Draw Synaptic Connections (lines between nearby nodes)
      const maxDistance = isMobile ? 80 : 120;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.25;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // 3. Render Particles / Neurons & Move
      particles.forEach((p) => {
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }

        // Mouse reaction effect
        if (mouse.active && !isMobile) {
          const mdx = mouse.x - p.x;
          const mdy = mouse.y - p.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(20, 184, 166, ${0.3 * (1 - mdist / 120)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        // Draw particle glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 4. Central Glowing Mind Orb Structure
      const cx = width / 2;
      const cy = height / 2;
      const orbRadius = isMobile ? 65 : 95;

      // Outer Pulsing Ring
      ctx.beginPath();
      ctx.arc(cx, cy, orbRadius + Math.sin(wavePhase * 2) * 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner Core Gradient
      const coreGradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, orbRadius);
      coreGradient.addColorStop(0, 'rgba(139, 92, 246, 0.35)');
      coreGradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.15)');
      coreGradient.addColorStop(1, 'rgba(20, 184, 166, 0)');

      ctx.beginPath();
      ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[320px] sm:h-[400px] lg:h-[450px] flex items-center justify-center overflow-hidden rounded-3xl bg-[#0B0F1D]/80 border border-indigo-500/20 shadow-2xl">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/10 via-teal-500/5 to-violet-600/10 pointer-events-none" />

      {/* Canvas Element */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Subtle overlay text badge inside hero canvas */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex items-center space-x-2 rounded-full bg-slate-950/80 px-3.5 py-1.5 backdrop-blur-md border border-indigo-500/20">
        <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
        <span className="text-[11px] font-medium text-slate-300">
          Neural Wave & Mind Synapse Visualization
        </span>
      </div>
    </div>
  );
};
