import { useState, useEffect } from 'react';

interface AnimatedCharacterProps {
  mood: 'happy' | 'thinking' | 'excited' | 'sad' | 'neutral';
  message?: string;
}

export function AnimatedCharacter({ mood, message }: AnimatedCharacterProps) {
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBounce(prev => !prev);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getExpression = () => {
    switch (mood) {
      case 'happy':
        return { eyes: '◠◠', mouth: '◡', color: 'from-green-400 to-emerald-500' };
      case 'thinking':
        return { eyes: '◔◔', mouth: '～', color: 'from-blue-400 to-indigo-500' };
      case 'excited':
        return { eyes: '★★', mouth: 'D', color: 'from-yellow-400 to-orange-500' };
      case 'sad':
        return { eyes: '╥╥', mouth: '︵', color: 'from-gray-400 to-slate-500' };
      default:
        return { eyes: '◉◉', mouth: '─', color: 'from-purple-400 to-violet-500' };
    }
  };

  const expression = getExpression();

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Character */}
      <div 
        className={`relative transition-transform duration-300 ${bounce ? 'translate-y-[-5px]' : 'translate-y-0'}`}
      >
        {/* Body */}
        <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${expression.color} shadow-xl flex items-center justify-center relative overflow-hidden`}>
          {/* Shine effect */}
          <div className="absolute top-2 left-4 w-4 h-4 bg-white/40 rounded-full blur-sm"></div>
          
          {/* Face */}
          <div className="text-center">
            <div className="text-2xl font-bold text-white tracking-wider">
              {expression.eyes}
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {expression.mouth}
            </div>
          </div>
        </div>
        
        {/* Little arms */}
        <div className="absolute top-1/2 -left-3 w-4 h-4 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full shadow animate-pulse"></div>
        <div className="absolute top-1/2 -right-3 w-4 h-4 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full shadow animate-pulse"></div>
        
        {/* Hat/Cap for SQL theme */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1 rounded-lg text-[10px] font-bold text-white shadow-lg">
            SQL
          </div>
        </div>
      </div>
      
      {/* Speech bubble */}
      {message && (
        <div className="relative bg-white rounded-2xl px-4 py-3 shadow-lg max-w-[200px] animate-fade-in">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 shadow-lg"></div>
          <p className="text-sm text-gray-700 text-center relative z-10">{message}</p>
        </div>
      )}
    </div>
  );
}
