
export enum AppState {
  INTRO = 'INTRO',
  GAME = 'GAME',
  CEREMONY_DECORATE = 'CEREMONY_DECORATE',
  CEREMONY_CANDLES = 'CEREMONY_CANDLES',
  CEREMONY_CUTTING = 'CEREMONY_CUTTING',
  CEREMONY_WISHES = 'CEREMONY_WISHES',
}

export type Language = 'en' | 'mr';

export interface Balloon {
  id: number;
  x: number;
  y: number;
  speed: number;
  color: string;
  popped: boolean;
  text?: string;
}

export interface Translations {
  title: string;
  subtitle: string;
  playGame: string;
  score: string;
  target: string;
  winMessage: string;
  decorateCake: string;
  decorateHint: string;
  nextStep: string;
  blowCandles: string;
  cutCake: string;
  happyBirthday: string;
  loadingWishes: string;
  micPermission: string;
  tapInstead: string;
  eatCake: string;
  restart: string;
  gameOver: string;
  tryAgain: string;
  gameInstructions: string;
}

export const DICTIONARY: Record<Language, Translations> = {
  en: {
    title: "Happy Birthday Mom!",
    subtitle: "A special celebration just for you!",
    playGame: "Play Birthday Game",
    score: "Score",
    target: "Target",
    winMessage: "You Won! Time for Cake!",
    decorateCake: "Decorate Your Cake",
    decorateHint: "Tap to add fruits, candies, and love!",
    nextStep: "Next ❤️",
    blowCandles: "Blow out the candles!",
    cutCake: "Swipe to cut the cake",
    happyBirthday: "Happy Birthday!",
    loadingWishes: "Writing a special wish...",
    micPermission: "Allow microphone to blow out candles",
    tapInstead: "Or tap candles to blow them out",
    eatCake: "Tap the cake to enjoy!",
    restart: "Celebrate Again",
    gameOver: "Good try!",
    tryAgain: "Try Again",
    gameInstructions: "Swap items to match 3 sweets!"
  },
  mr: {
    title: "वाढदिवसाच्या शुभेच्छा आई!",
    subtitle: "तुझ्यासाठी एक खास उत्सव!",
    playGame: "वाढदिवसाचा खेळ खेळा",
    score: "गुण",
    target: "लक्ष्य",
    winMessage: "तू जिंकलीस! आता केक कापुया!",
    decorateCake: "तुझा केक सजव",
    decorateHint: "फळे आणि चॉकलेट जोडण्यासाठी टॅप करा!",
    nextStep: "पुढे जा ❤️",
    blowCandles: "मेणबत्त्या विझवण्यासाठी फूँक मार!",
    cutCake: "केक कापण्यासाठी स्वाइप करा",
    happyBirthday: "वाढदिवसाच्या हार्दिक शुभेच्छा!",
    loadingWishes: "तुझ्यासाठी खास शुभेच्छा लिहित आहे...",
    micPermission: "मेणबत्त्या विझवण्यासाठी माइकची परवानगी द्या",
    tapInstead: "किंवा मेणबत्त्यांवर टॅप करा",
    eatCake: "खाण्यासाठी केकवर टॅप करा!",
    restart: "पुन्हा साजरी करा",
    gameOver: "छान प्रयत्न!",
    tryAgain: "पुन्हा प्रयत्न करा",
    gameInstructions: "३ गोड पदार्थ जुळवण्यासाठी त्यांची अदलाबदल करा!"
  }
};
