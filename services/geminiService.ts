import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBirthdayWish = async (language: Language): Promise<string> => {
  const prompt = language === 'mr' 
    ? "Write a heartwarming, emotional, and poetic birthday wish for a mother in Marathi. Do not include English translation. Keep it under 40 words. Focus on her love, sacrifice, and your gratitude."
    : "Write a heartwarming, emotional, and poetic birthday wish for a mother in English. Keep it under 40 words. Focus on love, gratitude, and her importance in your life.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || (language === 'mr' ? "वाढदिवसाच्या खूप खूप शुभेच्छा आई! तू आमचे जग आहेस." : "Happy Birthday Mom! You are the world to us.");
  } catch (error) {
    console.error("Error generating wish:", error);
    return language === 'mr' 
      ? "वाढदिवसाच्या हार्दिक शुभेच्छा! तुझे आयुष्य आनंदाने भरून जावो. आम्ही तुझ्यावर खूप प्रेम करतो." 
      : "Happy Birthday Mom! Wishing you a day filled with love, laughter, and everything you deserve.";
  }
};