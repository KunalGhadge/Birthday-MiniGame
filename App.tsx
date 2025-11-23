
import React, { useState } from 'react';
import { AppState, Language, DICTIONARY } from './types';
import { CandyGame } from './components/CandyGame';
import { CakeCeremony } from './components/CakeCeremony';
import { LanguageToggle } from './components/LanguageToggle';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.INTRO);
  const [language, setLanguage] = useState<Language>('en');

  const t = DICTIONARY[language];

  const handleStart = () => {
    audioService.resume();
    audioService.playPop();
    setState(AppState.GAME);
  };

  const handleWin = () => {
    // Skip decoration, go straight to ceremony
    setState(AppState.CEREMONY_CANDLES);
  };

  return (
    <div className="w-full h-full relative font-sans overflow-hidden bg-pink-50">
      <LanguageToggle language={language} setLanguage={setLanguage} />

      {state === AppState.INTRO && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-pink-50 to-purple-100 text-center p-6">
          <div className="animate-float mb-8 text-8xl drop-shadow-lg">🎂</div>
          <h1 className="text-5xl md:text-7xl font-bold text-pink-600 mb-4 font-script drop-shadow-sm">
            {t.title}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-md">
            {t.subtitle}
          </p>
          <button
            onClick={handleStart}
            className="px-10 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-xl font-bold shadow-xl transform hover:scale-105 transition-all active:scale-95 ring-4 ring-pink-200 animate-pulse"
          >
            {t.playGame} ▷
          </button>
        </div>
      )}

      {state === AppState.GAME && (
        <CandyGame onWin={handleWin} language={language} />
      )}

      {(state === AppState.CEREMONY_DECORATE ||
        state === AppState.CEREMONY_CANDLES || 
        state === AppState.CEREMONY_CUTTING || 
        state === AppState.CEREMONY_WISHES) && (
          <CakeCeremony state={state} setState={setState} language={language} />
      )}
    </div>
  );
};

export default App;
