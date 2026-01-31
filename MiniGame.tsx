import { useState, useEffect } from 'react';
import { miniGameLevels } from '../data/lessons';

interface MiniGameProps {
  isDark: boolean;
}

export function MiniGame({ isDark }: MiniGameProps) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [pieces, setPieces] = useState<string[]>([]);
  const [answer, setAnswer] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);

  const level = miniGameLevels[currentLevel];

  useEffect(() => {
    resetLevel();
  }, [currentLevel]);

  const resetLevel = () => {
    const shuffled = [...miniGameLevels[currentLevel].pieces].sort(() => Math.random() - 0.5);
    setPieces(shuffled);
    setAnswer([]);
    setFeedback('none');
    setShowHint(false);
  };

  const addPiece = (piece: string, index: number) => {
    setAnswer([...answer, piece]);
    setPieces(pieces.filter((_, i) => i !== index));
    setFeedback('none');
  };

  const removePiece = (index: number) => {
    const piece = answer[index];
    setPieces([...pieces, piece]);
    setAnswer(answer.filter((_, i) => i !== index));
    setFeedback('none');
  };

  const checkAnswer = () => {
    const isCorrect = answer.join(' ') === level.correctOrder.join(' ');
    
    if (isCorrect) {
      setFeedback('correct');
      setScore(prev => prev + 10);
      
      if (!completedLevels.includes(currentLevel)) {
        setCompletedLevels([...completedLevels, currentLevel]);
      }
      
      // Auto advance after delay
      setTimeout(() => {
        if (currentLevel < miniGameLevels.length - 1) {
          setCurrentLevel(prev => prev + 1);
        }
      }, 1500);
    } else {
      setFeedback('wrong');
      setScore(prev => Math.max(0, prev - 5));
    }
  };

  const bgClass = isDark ? 'bg-slate-900' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-slate-800';
  const borderClass = isDark ? 'border-slate-700' : 'border-slate-200';
  const mutedClass = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`rounded-2xl ${bgClass} shadow-xl overflow-hidden border ${borderClass}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧩</span>
            <div>
              <h2 className="text-xl font-bold text-white">Mini Game SQL</h2>
              <p className="text-pink-100 text-sm">Ghép câu lệnh SQL đúng thứ tự!</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-white">
              <span className="text-2xl font-bold">{score}</span>
              <span className="text-sm ml-1">điểm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className={`p-4 border-b ${borderClass}`}>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {miniGameLevels.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentLevel(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                i === currentLevel
                  ? 'bg-pink-500 text-white'
                  : completedLevels.includes(i)
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
                    : isDark
                      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {completedLevels.includes(i) && '✓ '}
              Level {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Game Area */}
      <div className="p-6">
        <h3 className={`text-lg font-semibold ${textClass} mb-4 text-center`}>
          {level.name}
        </h3>

        {/* Answer Area */}
        <div className={`min-h-20 p-4 rounded-2xl border-2 border-dashed ${
          feedback === 'correct' 
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
            : feedback === 'wrong'
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : isDark ? 'border-slate-600 bg-slate-800' : 'border-slate-300 bg-slate-50'
        } mb-6`}>
          <div className="flex flex-wrap gap-2 justify-center min-h-12 items-center">
            {answer.length === 0 ? (
              <span className={mutedClass}>Kéo các mảnh vào đây...</span>
            ) : (
              answer.map((piece, i) => (
                <button
                  key={i}
                  onClick={() => removePiece(i)}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-mono font-semibold shadow-lg hover:scale-105 transition-transform"
                >
                  {piece}
                </button>
              ))
            )}
          </div>
          
          {feedback === 'correct' && (
            <div className="text-center mt-3 text-green-600 dark:text-green-400 font-semibold animate-pulse">
              🎉 Chính xác! +10 điểm
            </div>
          )}
          
          {feedback === 'wrong' && (
            <div className="text-center mt-3 text-red-600 dark:text-red-400 font-semibold">
              ❌ Chưa đúng! Thử lại nhé
            </div>
          )}
        </div>

        {/* Available Pieces */}
        <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'} mb-6`}>
          <div className="flex flex-wrap gap-3 justify-center">
            {pieces.map((piece, i) => (
              <button
                key={i}
                onClick={() => addPiece(piece, i)}
                className={`px-4 py-2 rounded-xl font-mono font-semibold transition-all hover:scale-105 ${
                  isDark 
                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' 
                    : 'bg-white text-slate-700 hover:bg-slate-50 shadow'
                }`}
              >
                {piece}
              </button>
            ))}
          </div>
        </div>

        {/* Hint */}
        {showHint && (
          <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-amber-900/30 border-amber-700' : 'bg-amber-50 border-amber-200'} border`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">💡</span>
              <span className={mutedClass}>{level.hint}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={checkAnswer}
            disabled={answer.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            ✓ Kiểm tra
          </button>
          
          <button
            onClick={() => setShowHint(true)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              isDark 
                ? 'bg-amber-600 text-white hover:bg-amber-700' 
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            💡 Gợi ý
          </button>
          
          <button
            onClick={resetLevel}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              isDark 
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            🔄 Làm lại
          </button>
        </div>
      </div>

      {/* Correct Answer Preview */}
      <div className={`p-4 border-t ${borderClass} ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
        <div className="flex items-center justify-between">
          <span className={`text-sm ${mutedClass}`}>
            Câu đúng: <code className={`font-mono ${isDark ? 'text-green-400' : 'text-green-600'}`}>{level.correctOrder.join(' ')}</code>
          </span>
          
          <div className="flex items-center gap-2">
            <span className={`text-sm ${mutedClass}`}>
              Hoàn thành: {completedLevels.length}/{miniGameLevels.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
