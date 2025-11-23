import React, { useEffect, useRef, useState } from 'react';
import { AppState, Language, DICTIONARY } from '../types';
import { audioService } from '../services/audioService';
import { generateBirthdayWish } from '../services/geminiService';
import { VoxelCake } from './VoxelCake';

interface Props {
  state: AppState;
  setState: (s: AppState) => void;
  language: Language;
}

export const CakeCeremony: React.FC<Props> = ({ state, setState, language }) => {
  const [flamesOut, setFlamesOut] = useState<boolean[]>([false, false, false, false, false]);
  const [cutProgress, setCutProgress] = useState(0);
  const [wish, setWish] = useState<string>('');
  const [confetti, setConfetti] = useState<{id: number, left: number, color: string}[]>([]);
  const [micError, setMicError] = useState(false);
  const [isCut, setIsCut] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const blowingRef = useRef(false);

  const t = DICTIONARY[language];

  // Candles Logic (Mic)
  useEffect(() => {
    if (state === AppState.CEREMONY_CANDLES) {
      const initMic = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const analyser = audioContext.createAnalyser();
          const microphone = audioContext.createMediaStreamSource(stream);
          
          microphone.connect(analyser);
          analyser.fftSize = 256;
          
          audioContextRef.current = audioContext;
          analyserRef.current = analyser;

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const checkBlow = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            
            let sum = 0;
            for(let i = 0; i < bufferLength; i++) sum += dataArray[i];
            const average = sum / bufferLength;

            if (average > 40) { // Sensitive threshold
               blowOutOneCandle();
            }
            animationFrameRef.current = requestAnimationFrame(checkBlow);
          };
          checkBlow();
        } catch (err) {
          console.error("Mic error", err);
          setMicError(true);
        }
      };
      initMic();
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [state]);

  const blowOutOneCandle = () => {
    setFlamesOut(prev => {
      const idx = prev.findIndex(f => !f);
      if (idx !== -1) {
         const next = [...prev];
         next[idx] = true;
         if (next.every(x => x)) {
             setTimeout(() => {
                 audioService.playCheer();
                 setState(AppState.CEREMONY_CUTTING);
             }, 1000);
         }
         return next;
      }
      return prev;
    });
  };

  const handleBlowButton = () => {
    if (blowingRef.current) return;
    blowingRef.current = true;
    
    let count = 0;
    const interval = setInterval(() => {
        blowOutOneCandle();
        count++;
        if (count >= 5) {
            clearInterval(interval);
            blowingRef.current = false;
        }
    }, 300);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (state !== AppState.CEREMONY_CUTTING || isCut) return;
    
    // Simple logic: dragging across increments progress
    setCutProgress(prev => {
      const next = prev + 2;
      if (next >= 100) {
        audioService.playCheer();
        setIsCut(true);
        setTimeout(() => {
            setState(AppState.CEREMONY_WISHES);
            fetchWish();
        }, 1000); // Wait for cut animation
      }
      return next;
    });
  };

  const fetchWish = async () => {
      const w = await generateBirthdayWish(language);
      setWish(w);
      startConfetti();
  };

  const startConfetti = () => {
      const colors = ['#FF0D57', '#1E88E5', '#FFC107', '#9C27B0', '#4CAF50'];
      const newConfetti = Array.from({ length: 60 }).map((_, i) => ({
          id: i,
          left: Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)]
      }));
      setConfetti(newConfetti);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-purple-50 transition-colors duration-1000 overflow-hidden">
      
      {/* Header */}
      <div className="mt-8 text-center z-20 pointer-events-none absolute top-0 w-full">
        <h1 className="text-2xl md:text-4xl font-script text-pink-600 mb-2 animate-bounce drop-shadow-sm">
          {state === AppState.CEREMONY_DECORATE && t.decorateCake}
          {state === AppState.CEREMONY_CANDLES && t.blowCandles}
          {state === AppState.CEREMONY_CUTTING && t.cutCake}
          {state === AppState.CEREMONY_WISHES && t.happyBirthday}
        </h1>
        <p className="text-gray-500 text-sm font-bold">
            {state === AppState.CEREMONY_CANDLES && micError && t.tapInstead}
        </p>
      </div>

      {/* 3D Scene Container */}
      <div className="relative w-full h-full">
        
        {/* Interaction Layer for Cutting */}
        <div 
            className="absolute inset-0 z-50 cursor-crosshair"
            onMouseMove={state === AppState.CEREMONY_CUTTING ? handleTouchMove : undefined}
            onTouchMove={state === AppState.CEREMONY_CUTTING ? handleTouchMove : undefined}
            style={{ pointerEvents: state === AppState.CEREMONY_CUTTING ? 'auto' : 'none' }}
        ></div>

        {/* 3D Voxel Cake */}
        <VoxelCake isCut={isCut} flamesOut={flamesOut} />

        {/* Knife Animation Overlay */}
        {state === AppState.CEREMONY_CUTTING && !isCut && (
            <div 
                className="absolute z-50 text-8xl pointer-events-none transition-all duration-100 ease-linear"
                style={{ 
                    left: '50%', 
                    top: `${30 + cutProgress/2}%`,
                    transform: `translate(-50%, -50%) rotateZ(-45deg)`,
                    opacity: 0.8,
                    textShadow: '10px 10px 20px rgba(0,0,0,0.5)'
                }}
            >
                🔪
            </div>
        )}
      </div>

      {/* Blow Candle Button */}
      {state === AppState.CEREMONY_CANDLES && (
          <div className="absolute bottom-10 z-40">
            <button
                onClick={handleBlowButton}
                className="px-10 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-xl font-bold shadow-[0_10px_0_rgb(180,83,9)] active:shadow-none active:translate-y-2 transform transition-all animate-pulse border-4 border-yellow-600"
            >
                Blow Candles 💨
            </button>
          </div>
      )}

      {/* Wishes Card */}
      {state === AppState.CEREMONY_WISHES && (
          <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-2xl p-8 max-w-lg w-full text-center shadow-[0_20px_0_rgba(0,0,0,0.2)] border-8 border-pink-300 animate-float transform scale-110">
                 <div className="text-6xl mb-4 animate-bounce">🎉</div>
                 <h2 className="text-3xl font-script text-pink-600 mb-6">{t.happyBirthday}</h2>
                 {wish ? (
                     <p className="text-xl text-gray-700 italic font-medium leading-relaxed font-serif">
                         "{wish}"
                     </p>
                 ) : (
                     <div className="flex flex-col items-center">
                        <p className="text-gray-400 animate-pulse mb-2">{t.loadingWishes}</p>
                        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                     </div>
                 )}
                 <div className="mt-8">
                     <button onClick={() => window.location.reload()} className="text-gray-400 underline hover:text-gray-600 text-sm font-bold uppercase tracking-widest">{t.restart}</button>
                 </div>
             </div>
          </div>
      )}

       {/* Confetti */}
       {confetti.map((c) => (
          <div 
            key={c.id} 
            className="confetti" 
            style={{ 
                left: `${c.left}%`, 
                backgroundColor: c.color,
                width: '15px', height: '15px',
                animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
      ))}
    </div>
  );
};
