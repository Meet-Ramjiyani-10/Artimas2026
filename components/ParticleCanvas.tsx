'use client';

import { useEffect, useRef } from 'react';

class Particle {
  x = 0;
  y = 0;
  size = 0;
  speedX = 0;
  speedY = 0;
  opacity = 0;
  flickerSpeed = 0;
  flickerOffset = 0;
  currentOpacity = 0;
  color: { r: number; g: number; b: number } = { r: 212, g: 136, b: 58 };

  constructor(private canvasW: number, private canvasH: number) {
    this.reset();
  }

  reset() {
    this.x = Math.random() * this.canvasW;
    this.y = Math.random() * this.canvasH;
    this.size = Math.random() * 2 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.15 - 0.1;
    this.opacity = Math.random() * 0.5 + 0.1;
    this.flickerSpeed = Math.random() * 0.02 + 0.005;
    this.flickerOffset = Math.random() * Math.PI * 2;

    const c = Math.random();
    if (c < 0.4)      this.color = { r: 212, g: 136, b: 58 };
    else if (c < 0.7) this.color = { r: 201, g: 160, b: 78 };
    else              this.color = { r: 232, g: 221, b: 208 };
  }

  update(time: number, w: number, h: number) {
    this.x += this.speedX;
    this.y += this.speedY;
    this.currentOpacity = this.opacity * (0.5 + 0.5 * Math.sin(time * this.flickerSpeed + this.flickerOffset));
    if (this.x < -10) this.x = w + 10;
    if (this.x > w + 10) this.x = -10;
    if (this.y < -10) this.y = h + 10;
    if (this.y > h + 10) this.y = -10;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { r, g, b } = this.color;
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 4);
    grad.addColorStop(0, `rgba(${r},${g},${b},${this.currentOpacity * 0.6})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},${this.currentOpacity})`;
    ctx.fill();
  }
}

const PARTICLE_COUNT = 80;

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let rafId: number;
    let time = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Re-init so particles are distributed across the new size
      particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle(canvas.width, canvas.height));
    }

    function animate() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time++;
      particles.forEach(p => {
        p.update(time, canvas.width, canvas.height);
        p.draw(ctx);
      });
      rafId = requestAnimationFrame(animate);
    }

    resize();
    window.addEventListener('resize', resize);
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} />;
}
