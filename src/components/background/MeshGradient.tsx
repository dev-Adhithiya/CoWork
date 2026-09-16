import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export function MeshGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      setIsDarkMode(!document.documentElement.classList.contains('light'));
    };
    
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createGradient = (x: number, y: number, radius: number, color: string) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'transparent');
      return gradient;
    };

    const animate = () => {
      time += 0.002;

      // Background color based on theme
      ctx.fillStyle = isDarkMode ? '#090d16' : '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Animated gradient blobs with Co-Work brand colors
      const blobs = isDarkMode ? [
        {
          x: canvas.width * 0.25 + Math.sin(time * 0.7) * 120,
          y: canvas.height * 0.35 + Math.cos(time * 0.5) * 90,
          radius: 460,
          color: 'rgba(43, 107, 243, 0.22)', // Co-Work Electric Royal Blue
        },
        {
          x: canvas.width * 0.75 + Math.cos(time * 0.6) * 130,
          y: canvas.height * 0.65 + Math.sin(time * 0.8) * 110,
          radius: 420,
          color: 'rgba(30, 58, 138, 0.35)', // Deep Navy Blue
        },
        {
          x: canvas.width * 0.5 + Math.sin(time * 0.5) * 90,
          y: canvas.height * 0.25 + Math.cos(time * 0.7) * 70,
          radius: 340,
          color: 'rgba(56, 189, 248, 0.12)', // Cyan highlight glow
        },
        {
          x: canvas.width * 0.2 + Math.cos(time * 0.4) * 70,
          y: canvas.height * 0.85 + Math.sin(time * 0.6) * 60,
          radius: 380,
          color: 'rgba(15, 23, 42, 0.7)', // Midnight Slate
        },
      ] : [
        {
          x: canvas.width * 0.25 + Math.sin(time * 0.7) * 120,
          y: canvas.height * 0.35 + Math.cos(time * 0.5) * 90,
          radius: 450,
          color: 'rgba(43, 107, 243, 0.12)', // Soft electric blue
        },
        {
          x: canvas.width * 0.75 + Math.cos(time * 0.6) * 130,
          y: canvas.height * 0.65 + Math.sin(time * 0.8) * 110,
          radius: 400,
          color: 'rgba(186, 230, 253, 0.45)', // Soft sky cyan
        },
        {
          x: canvas.width * 0.5 + Math.sin(time * 0.5) * 90,
          y: canvas.height * 0.25 + Math.cos(time * 0.7) * 70,
          radius: 350,
          color: 'rgba(224, 231, 255, 0.5)', // Soft indigo
        },
        {
          x: canvas.width * 0.2 + Math.cos(time * 0.4) * 70,
          y: canvas.height * 0.85 + Math.sin(time * 0.6) * 60,
          radius: 300,
          color: 'rgba(241, 245, 249, 0.6)', // Crisp light slate
        },
      ];

      blobs.forEach(blob => {
        ctx.fillStyle = createGradient(blob.x, blob.y, blob.radius, blob.color);
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      animationId = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [isDarkMode]);

  return (
    <motion.canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    />
  );
}

export default MeshGradient;
