
import React, { useEffect, useState, useCallback } from 'react';
import { Language, DICTIONARY } from '../types';
import { audioService } from '../services/audioService';

interface Props {
  onWin: () => void;
  language: Language;
}

const ITEMS = ['🍓', '🍫', '🍪', '🥛', '🧁', '🍬'];
const COLS = 7;
const ROWS = 7;
const WIN_SCORE = 300;

export const CandyGame: React.FC<Props> = ({ onWin, language }) => {
  const [grid, setGrid] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const t = DICTIONARY[language];

  // Initialize Board
  const createBoard = useCallback(() => {
    const newGrid = [];
    for (let i = 0; i < COLS * ROWS; i++) {
      newGrid.push(ITEMS[Math.floor(Math.random() * ITEMS.length)]);
    }
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setIsProcessing(false);
  }, []);

  useEffect(() => {
    createBoard();
  }, [createBoard]);

  // Check for matches
  const checkForMatches = useCallback((currentGrid: string[], isInitial = false) => {
    let matches = new Set<number>();

    // Check Rows
    for (let i = 0; i < COLS * ROWS; i++) {
      // Skip last 2 columns for row check
      if (i % COLS > COLS - 3) continue;
      
      const row = [i, i + 1, i + 2];
      const decidedColor = currentGrid[i];
      if (row.every(index => currentGrid[index] === decidedColor)) {
        row.forEach(r => matches.add(r));
      }
    }

    // Check Columns
    for (let i = 0; i < COLS * (ROWS - 2); i++) {
      const col = [i, i + COLS, i + COLS * 2];
      const decidedColor = currentGrid[i];
      if (col.every(index => currentGrid[index] === decidedColor)) {
        col.forEach(c => matches.add(c));
      }
    }

    if (matches.size > 0) {
      if (!isInitial) audioService.playMatch();
      
      const newGrid = [...currentGrid];
      const matchScore = matches.size * 10;
      
      // Remove matches
      matches.forEach(index => {
        newGrid[index] = '';
      });

      // Update State
      if (!isInitial) {
        setScore(prev => {
          const newScore = prev + matchScore;
          if (newScore >= WIN_SCORE) {
             audioService.playCheer();
             setTimeout(onWin, 500);
          }
          return newScore;
        });
      }

      // Fall animation sequence
      setTimeout(() => {
        moveDown(newGrid);
      }, 300);
      return true;
    } else {
        setIsProcessing(false);
    }
    return false;
  }, [onWin]);

  const moveDown = (currentGrid: string[]) => {
      const newGrid = [...currentGrid];
      
      for (let i = 0; i <= COLS * (ROWS - 1) - 1; i++) {
          const isFirstRow = i < COLS;
          if (isFirstRow && newGrid[i] === '') {
              newGrid[i] = ITEMS[Math.floor(Math.random() * ITEMS.length)];
          }

          if (newGrid[i + COLS] === '') {
              newGrid[i + COLS] = newGrid[i];
              newGrid[i] = '';
              // If we moved something down, we might need to fill top again next tick
          }
      }

      // Fill empty top row specifically
      for(let i=0; i < COLS; i++) {
          if (newGrid[i] === '') {
             newGrid[i] = ITEMS[Math.floor(Math.random() * ITEMS.length)];
          }
      }

      setGrid(newGrid);

      // Check if grid is full
      if (newGrid.includes('')) {
          setTimeout(() => moveDown(newGrid), 100);
      } else {
          // Grid full, check matches again
          setTimeout(() => checkForMatches(newGrid), 200);
      }
  };

  const handleDragStart = (e: any) => {
     // Simplifying to just click for better mobile support without drag libraries
  };

  const handleClick = (index: number) => {
      if (isProcessing) return;
      
      // Select first
      if (selected === null) {
          audioService.playPop(); // reuse pop for selection
          setSelected(index);
          return;
      }

      // Deselect
      if (selected === index) {
          setSelected(null);
          return;
      }

      // Check adjacency
      const isRowNeighbor = [selected - 1, selected + 1].includes(index) && Math.floor(selected / COLS) === Math.floor(index / COLS);
      const isColNeighbor = [selected - COLS, selected + COLS].includes(index);

      if (isRowNeighbor || isColNeighbor) {
          // Swap
          const newGrid = [...grid];
          const temp = newGrid[selected];
          newGrid[selected] = newGrid[index];
          newGrid[index] = temp;
          
          setGrid(newGrid);
          setSelected(null);
          setIsProcessing(true);
          audioService.playSwap();

          // Wait and check
          setTimeout(() => {
              const hasMatch = checkForMatches(newGrid);
              if (!hasMatch) {
                  // Swap back
                  audioService.playSwap();
                  setGrid(grid); // Revert to old grid
                  setIsProcessing(false);
              }
          }, 300);
      } else {
          // Clicked far away, just select new
          audioService.playPop();
          setSelected(index);
      }
  };

  // Initial Check (in case random board has matches, though we usually ignore score for initial)
  useEffect(() => {
      if (grid.length > 0 && !isProcessing && grid.some(x => x === '')) {
           // Should not happen, but safety
           moveDown(grid);
      }
  }, [grid]);


  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-pink-50 overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 w-full p-4 flex justify-between items-center z-10 bg-white/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-2 shadow border border-pink-100">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t.score}</p>
                <p className="text-2xl font-bold text-pink-500 font-script">{score}</p>
            </div>
            <div className="text-center">
                 <p className="text-pink-600 font-bold text-sm animate-pulse">{t.gameInstructions}</p>
            </div>
            <div className="bg-white rounded-xl p-2 shadow border border-blue-100">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t.target}</p>
                <p className="text-2xl font-bold text-blue-500 font-script">{WIN_SCORE}</p>
            </div>
        </div>

        {/* Game Board */}
        <div className="w-full max-w-md p-4 mt-16">
            <div 
                className="grid gap-1 bg-pink-200 p-2 rounded-2xl shadow-inner border-4 border-white"
                style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
            >
                {grid.map((item, index) => (
                    <div
                        key={index}
                        onClick={() => handleClick(index)}
                        className={`
                            aspect-square flex items-center justify-center text-3xl md:text-4xl 
                            cursor-pointer transition-all duration-200 rounded-lg select-none
                            ${selected === index ? 'bg-white scale-110 shadow-lg ring-2 ring-pink-400 z-10' : 'bg-white/40 hover:bg-white/60 active:scale-95'}
                            ${item === '' ? 'invisible' : ''}
                        `}
                    >
                        {item}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};
