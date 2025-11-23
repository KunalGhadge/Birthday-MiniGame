import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Language, DICTIONARY } from '../types';
import { audioService } from '../services/audioService';

interface Props {
  onWin: () => void;
  language: Language;
}

interface Bubble {
  x: number;
  y: number;
  type: number; // Index in TYPES
  row: number;
  col: number;
  active: boolean;
}

interface Projectile {
  x: number;
  y: number;
  dx: number;
  dy: number;
  type: number;
  active: boolean;
}

const BUBBLE_TYPES = ['🍓', '🍫', '🫐', '🍋', '🥛'];
const COLORS = ['#FF9999', '#D2691E', '#99CCFF', '#FFFACD', '#F0F8FF'];
const ROWS = 6;
const COLS = 8;
const WIN_SCORE = 500;

export const BubbleGame: React.FC<Props> = ({ onWin, language }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [instructions, setInstructions] = useState(true);
  
  // Game State Refs (to avoid closure staleness in animation loop)
  const gridRef = useRef<Bubble[]>([]);
  const projectileRef = useRef<Projectile | null>(null);
  const nextTypeRef = useRef<number>(Math.floor(Math.random() * BUBBLE_TYPES.length));
  const scoreRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  const t = DICTIONARY[language];

  const initGame = useCallback(() => {
    // Initialize Grid
    const newGrid: Bubble[] = [];
    for (let r = 0; r < 4; r++) { // Start with 4 rows
      for (let c = 0; c < COLS; c++) {
        // Hex offset
        if (r % 2 !== 0 && c === COLS - 1) continue; 
        newGrid.push({
          x: 0, // Calculated in render
          y: 0,
          row: r,
          col: c,
          type: Math.floor(Math.random() * BUBBLE_TYPES.length),
          active: true
        });
      }
    }
    gridRef.current = newGrid;
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
    projectileRef.current = null;
  }, []);

  useEffect(() => {
    initGame();
    setTimeout(() => setInstructions(false), 3000);
  }, [initGame]);

  const shoot = (targetX: number, targetY: number, canvasWidth: number, canvasHeight: number) => {
    if (projectileRef.current && projectileRef.current.active) return;
    if (gameOver) return;

    audioService.playShoot();

    const startX = canvasWidth / 2;
    const startY = canvasHeight - 40;
    const angle = Math.atan2(targetY - startY, targetX - startX);
    const speed = 15;

    projectileRef.current = {
      x: startX,
      y: startY,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      type: nextTypeRef.current,
      active: true
    };

    // Prepare next bubble
    nextTypeRef.current = Math.floor(Math.random() * BUBBLE_TYPES.length);
  };

  const checkCollision = (p: Projectile, radius: number) => {
    // Wall collision
    if (p.x < radius || p.x > canvasRef.current!.width - radius) {
      p.dx *= -1;
      p.x = Math.max(radius, Math.min(canvasRef.current!.width - radius, p.x));
    }

    // Ceiling collision
    if (p.y < radius) {
      snapProjectile(p, radius);
      return;
    }

    // Bubble collision
    for (let b of gridRef.current) {
      if (!b.active) continue;
      const dx = p.x - b.x;
      const dy = p.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < radius * 2) {
        snapProjectile(p, radius);
        return;
      }
    }
  };

  const snapProjectile = (p: Projectile, radius: number) => {
    p.active = false;
    
    // Find closest grid spot
    // Simple hexagonal grid mapping logic approximation
    const rowHeight = radius * 1.732; // sqrt(3)
    const approxRow = Math.round(p.y / rowHeight);
    const isOdd = approxRow % 2 !== 0;
    const colWidth = radius * 2;
    const offsetX = isOdd ? radius : 0;
    const approxCol = Math.round((p.x - offsetX - radius) / colWidth);

    const newBubble: Bubble = {
      x: 0, // Recalculated by render
      y: 0,
      row: approxRow,
      col: approxCol,
      type: p.type,
      active: true
    };
    
    // Check if spot is occupied (crude check)
    const existing = gridRef.current.find(b => b.row === newBubble.row && b.col === newBubble.col && b.active);
    if (existing) {
       // Just put it below to avoid overlap glitch
       newBubble.row++; 
    }

    gridRef.current.push(newBubble);
    
    // Find Matches
    const matches = findMatches(newBubble, gridRef.current);
    if (matches.length >= 3) {
      audioService.playMatch();
      matches.forEach(b => b.active = false);
      // Remove inactive
      gridRef.current = gridRef.current.filter(b => b.active);
      
      // Update Score
      const points = matches.length * 10;
      scoreRef.current += points;
      setScore(scoreRef.current);

      if (scoreRef.current >= WIN_SCORE) {
        audioService.playCheer();
        onWin();
      }
    } else {
        // Add foul? Maybe later.
        // Check game over (reached bottom)
        if (newBubble.row > 12) {
            setGameOver(true);
        }
    }
  };

  const findMatches = (start: Bubble, grid: Bubble[]) => {
    const toCheck = [start];
    const visited = new Set<Bubble>();
    const matches: Bubble[] = [];
    const targetType = start.type;

    while (toCheck.length > 0) {
      const current = toCheck.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);
      
      if (current.type === targetType) {
        matches.push(current);
        // Find neighbors
        const neighbors = getNeighbors(current, grid);
        neighbors.forEach(n => {
           if (!visited.has(n)) toCheck.push(n);
        });
      }
    }
    return matches;
  };

  const getNeighbors = (b: Bubble, grid: Bubble[]) => {
    // Hex neighbors
    const directions = b.row % 2 === 0 
      ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
      : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
      
    return directions.map(d => {
      return grid.find(n => n.active && n.row === b.row + d[0] && n.col === b.col + d[1]);
    }).filter((n): n is Bubble => !!n);
  };

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      // Setup canvas size
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      const W = canvas.width;
      const H = canvas.height;
      const RADIUS = Math.min(W / (COLS * 2 + 1), 25);

      // Clear
      ctx.fillStyle = '#FFF5F7'; // Pinkish white bg
      ctx.fillRect(0, 0, W, H);

      // Render Grid
      gridRef.current.forEach(b => {
        if (!b.active) return;
        const rowHeight = RADIUS * 1.732;
        const colWidth = RADIUS * 2;
        const isOdd = b.row % 2 !== 0;
        const x = (b.col * colWidth) + RADIUS + (isOdd ? RADIUS : 0) + (W - (COLS * colWidth))/2; // Center grid
        const y = (b.row * rowHeight) + RADIUS + 60; // Offset from top
        
        b.x = x; // Update real coords
        b.y = y;

        drawBubble(ctx, x, y, RADIUS, b.type);
      });

      // Update & Render Projectile
      if (projectileRef.current && projectileRef.current.active) {
        const p = projectileRef.current;
        p.x += p.dx;
        p.y += p.dy;
        
        checkCollision(p, RADIUS);

        if (p.active) {
           drawBubble(ctx, p.x, p.y, RADIUS, p.type);
        } else {
            projectileRef.current = null;
        }
      }

      // Render Shooter
      const shooterX = W / 2;
      const shooterY = H - 40;
      drawBubble(ctx, shooterX, shooterY, RADIUS, nextTypeRef.current);
      
      // Arrow
      ctx.beginPath();
      ctx.moveTo(shooterX, shooterY - 30);
      ctx.lineTo(shooterX - 10, shooterY - 15);
      ctx.lineTo(shooterX + 10, shooterY - 15);
      ctx.fillStyle = '#FF69B4';
      ctx.fill();

      animFrameRef.current = requestAnimationFrame(loop);
    };

    const drawBubble = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, type: number) => {
      ctx.beginPath();
      ctx.arc(x, y, r - 2, 0, Math.PI * 2);
      ctx.fillStyle = COLORS[type];
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.font = `${r}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.fillText(BUBBLE_TYPES[type], x, y + 2);
    };

    loop();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameOver]); // Re-bind if game over state changes

  const handlePointer = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    shoot(e.clientX - rect.left, e.clientY - rect.top, canvasRef.current.width, canvasRef.current.height);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
        {/* Score Board */}
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-10">
            <div className="bg-white/80 backdrop-blur rounded-xl p-2 shadow-md">
                <p className="text-xs text-gray-500 uppercase font-bold">{t.score}</p>
                <p className="text-2xl font-bold text-pink-600 font-script">{score}</p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-2 shadow-md">
                <p className="text-xs text-gray-500 uppercase font-bold">{t.target}</p>
                <p className="text-2xl font-bold text-blue-500 font-script">{WIN_SCORE}</p>
            </div>
        </div>

        <canvas 
            ref={canvasRef}
            className="w-full h-full touch-none cursor-pointer"
            onPointerDown={handlePointer}
        />

        {/* Instructions Overlay */}
        {instructions && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="bg-black/60 text-white px-6 py-4 rounded-xl backdrop-blur-md animate-bounce">
                    <p className="text-xl font-bold">{t.gameInstructions}</p>
                </div>
            </div>
        )}

        {/* Game Over / Win UI handled by parent mostly, but if lost: */}
        {gameOver && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
                 <h2 className="text-4xl text-white font-script mb-4">{t.gameOver}</h2>
                 <button 
                    onClick={initGame}
                    className="px-6 py-3 bg-pink-500 text-white rounded-full font-bold shadow-lg hover:bg-pink-600 transition"
                 >
                    {t.tryAgain}
                 </button>
            </div>
        )}
    </div>
  );
};