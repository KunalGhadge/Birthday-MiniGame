import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Balloon, Language, DICTIONARY } from '../types';
import { audioService } from '../services/audioService';

interface Props {
  onWin: () => void;
  language: Language;
}

const BALLOON_COLORS = ['#FF69B4', '#FFD700', '#87CEEB', '#DDA0DD', '#FF6347'];
const WIN_SCORE = 15;

export const BalloonGame: React.FC<Props> = ({ onWin, language }) => {
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [score, setScore] = useState(0);
  const requestRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const texts = language === 'mr' ? ['प्रेम', 'आनंद', 'सुख', 'आरोग्य', 'आई'] : ['Love', 'Joy', 'Hugs', 'Mom', 'Best'];

  const spawnBalloon = useCallback(() => {
    const id = Date.now() + Math.random();
    const x = Math.random() * (window.innerWidth - 60); // 60px balloon width
    const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    const text = Math.random() > 0.6 ? texts[Math.floor(Math.random() * texts.length)] : undefined;
    
    setBalloons(prev => [...prev, {
      id,
      x,
      y: window.innerHeight + 100,
      speed: 2 + Math.random() * 2,
      color,
      popped: false,
      text
    }]);
  }, [texts]);

  const updateGame = useCallback(() => {
    setBalloons(prev => {
      const nextBalloons = prev
        .map(b => ({ ...b, y: b.y - b.speed }))
        .filter(b => b.y > -100 && !b.popped); // Remove if off screen or popped
      
      // Spawn new balloon rarely inside the loop? No, better use interval outside.
      return nextBalloons;
    });
    requestRef.current = requestAnimationFrame(updateGame);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateGame);
    const interval = setInterval(spawnBalloon, 800);
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      clearInterval(interval);
    };
  }, [spawnBalloon, updateGame]);

  const popBalloon = (id: number) => {
    audioService.playPop();
    setBalloons(prev => prev.map(b => b.id === id ? { ...b, popped: true } : b));
    
    // Remove popped balloon shortly after for visual effect if needed, 
    // but here we filter !popped in update loop, so we just set state to trigger effect immediately.
    // Actually, let's keep it simple: filter it out next frame.
    
    const newScore = score + 1;
    setScore(newScore);
    
    if (newScore >= WIN_SCORE) {
      audioService.playCheer();
      onWin();
    }
  };

  const t = DICTIONARY[language];

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gradient-to-b from-blue-100 to-pink-100 overflow-hidden touch-none select-none">
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 flex flex-col items-center z-10 pointer-events-none">
        <h2 className="text-2xl font-bold text-pink-600 drop-shadow-sm font-script mb-2">{t.score}</h2>
        <div className="w-64 h-6 bg-white rounded-full border-2 border-pink-300 overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-pink-400 to-red-400 transition-all duration-300 ease-out"
            style={{ width: `${Math.min((score / WIN_SCORE) * 100, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-pink-700 font-bold">{score} / {WIN_SCORE}</p>
      </div>

      {/* Balloons */}
      {balloons.map(b => (
        <div
          key={b.id}
          onPointerDown={() => popBalloon(b.id)}
          className="absolute flex items-center justify-center cursor-pointer transform hover:scale-110 active:scale-95 transition-transform"
          style={{
            left: b.x,
            top: b.y,
            width: '70px',
            height: '85px',
            touchAction: 'none',
          }}
        >
          {/* Balloon Shape SVG */}
          <svg viewBox="0 0 100 120" className="w-full h-full overflow-visible drop-shadow-lg">
             <path 
               d="M50,0 C20,0 0,25 0,55 C0,90 40,110 50,120 C60,110 100,90 100,55 C100,25 80,0 50,0 Z" 
               fill={b.color} 
               stroke="rgba(0,0,0,0.1)" 
               strokeWidth="2"
             />
             {/* String */}
             <path d="M50,120 Q50,140 40,150" stroke="#888" strokeWidth="2" fill="none" />
             {/* Shine */}
             <ellipse cx="30" cy="30" rx="10" ry="20" fill="rgba(255,255,255,0.4)" transform="rotate(-30 30 30)" />
          </svg>
          {b.text && (
            <span className="absolute top-1/3 text-white font-bold text-sm pointer-events-none drop-shadow-md">
              {b.text}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};