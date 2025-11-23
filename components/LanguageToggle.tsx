import React from 'react';
import { Language } from '../types';

interface Props {
  language: Language;
  setLanguage: (l: Language) => void;
}

export const LanguageToggle: React.FC<Props> = ({ language, setLanguage }) => {
  return (
    <div className="absolute top-4 right-4 z-50 bg-white/80 backdrop-blur rounded-full p-1 shadow-md flex">
      <button 
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded-full text-sm font-bold transition-colors ${language === 'en' ? 'bg-pink-500 text-white' : 'text-gray-600'}`}
      >
        ENG
      </button>
      <button 
        onClick={() => setLanguage('mr')}
        className={`px-3 py-1 rounded-full text-sm font-bold transition-colors ${language === 'mr' ? 'bg-pink-500 text-white' : 'text-gray-600'}`}
      >
        मराठी
      </button>
    </div>
  );
};