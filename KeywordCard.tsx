import { useState } from 'react';
import { SQLKeyword } from '../data/sqlLessons';

interface KeywordCardProps {
  keyword: SQLKeyword;
  isLearned: boolean;
  onLearn: () => void;
}

export function KeywordCard({ keyword, isLearned, onLearn }: KeywordCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="perspective-1000 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div 
        className={`relative w-full h-40 transition-transform duration-500 transform-style-preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div 
          className={`absolute inset-0 backface-hidden rounded-xl p-4 flex flex-col items-center justify-center shadow-lg border-2 ${
            isLearned 
              ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300' 
              : 'bg-gradient-to-br from-indigo-50 to-purple-100 border-indigo-300'
          }`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-2xl font-mono font-bold text-indigo-700">
            {keyword.keyword}
          </span>
          <span className="text-xs text-slate-500 mt-2">Nhấn để xem nghĩa</span>
          {isLearned && (
            <span className="absolute top-2 right-2 text-green-500">✓</span>
          )}
        </div>
        
        {/* Back */}
        <div 
          className="absolute inset-0 backface-hidden rounded-xl p-4 bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg border-2 border-slate-600 flex flex-col justify-between"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div>
            <div className="text-sm text-slate-400 mb-1">Ý nghĩa:</div>
            <div className="text-sm">{keyword.meaning}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Ví dụ:</div>
            <code className="text-xs text-green-400 bg-black/30 px-2 py-1 rounded block">
              {keyword.example}
            </code>
          </div>
          {!isLearned && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLearn();
              }}
              className="mt-2 w-full py-1.5 bg-green-500 hover:bg-green-600 rounded-lg text-sm font-semibold transition-colors"
            >
              Đánh dấu đã học ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
