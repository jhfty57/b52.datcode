import { useState } from 'react';
import { flashcards as initialFlashcards } from '../data/lessons';

interface FlashcardsProps {
  isDark: boolean;
  masteredCards: string[];
  onMaster: (id: string) => void;
}

export function Flashcards({ isDark, masteredCards, onMaster }: FlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unmastered' | 'mastered'>('all');
  const [category, setCategory] = useState<string>('all');

  const categories = ['all', 'DDL', 'DML', 'DCL'];
  
  const filteredCards = initialFlashcards.filter(card => {
    const matchesFilter = filter === 'all' 
      || (filter === 'mastered' && masteredCards.includes(card.id))
      || (filter === 'unmastered' && !masteredCards.includes(card.id));
    const matchesCategory = category === 'all' || card.category === category;
    return matchesFilter && matchesCategory;
  });

  const currentCard = filteredCards[currentIndex];

  const next = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % filteredCards.length);
    }, 150);
  };

  const prev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + filteredCards.length) % filteredCards.length);
    }, 150);
  };

  const shuffle = () => {
    setIsFlipped(false);
    setCurrentIndex(Math.floor(Math.random() * filteredCards.length));
  };

  const bgClass = isDark ? 'bg-slate-900' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-slate-800';
  const borderClass = isDark ? 'border-slate-700' : 'border-slate-200';
  const mutedClass = isDark ? 'text-slate-400' : 'text-slate-500';

  const isMastered = currentCard && masteredCards.includes(currentCard.id);

  return (
    <div className={`rounded-2xl ${bgClass} shadow-xl overflow-hidden border ${borderClass}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎴</span>
            <div>
              <h2 className="text-xl font-bold text-white">Flashcard DDL | DML | DCL</h2>
              <p className="text-pink-100 text-sm">Học thuộc nhanh các lệnh SQL</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">
              {masteredCards.length}/{initialFlashcards.length} đã thuộc
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 border-b ${borderClass} flex flex-wrap gap-3`}>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${mutedClass}`}>Lọc:</span>
          {(['all', 'unmastered', 'mastered'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setCurrentIndex(0); }}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-amber-500 text-white'
                  : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? 'Tất cả' : f === 'mastered' ? 'Đã thuộc' : 'Chưa thuộc'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-sm ${mutedClass}`}>Chủ đề:</span>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setCurrentIndex(0); }}
            className={`px-3 py-1 rounded-lg text-sm ${
              isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
            } border outline-none`}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'Tất cả' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Card Area */}
      <div className="p-8">
        {filteredCards.length === 0 ? (
          <div className={`text-center py-12 ${mutedClass}`}>
            <span className="text-5xl">🎉</span>
            <p className="mt-4 text-lg">Không có thẻ nào!</p>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="flex justify-between items-center mb-6">
              <span className={mutedClass}>
                Thẻ {currentIndex + 1} / {filteredCards.length}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
              }`}>
                {currentCard?.category}
              </span>
            </div>

            {/* Flashcard */}
            <div 
              className="perspective-1000 cursor-pointer mx-auto max-w-md"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div 
                className={`relative w-full h-64 transition-transform duration-500`}
                style={{ 
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
              >
                {/* Front */}
                <div 
                  className={`absolute inset-0 rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg border-2 ${
                    isMastered 
                      ? 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-green-300 dark:border-green-700'
                      : 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border-amber-300 dark:border-amber-700'
                  }`}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="text-4xl font-mono font-bold text-amber-700 dark:text-amber-400">
                    {currentCard?.front}
                  </span>
                  <span className={`text-sm mt-4 ${mutedClass}`}>Nhấn để lật</span>
                  {isMastered && (
                    <span className="absolute top-4 right-4 text-green-500 text-2xl">✓</span>
                  )}
                </div>

                {/* Back */}
                <div 
                  className={`absolute inset-0 rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg ${
                    isDark ? 'bg-slate-800 border-slate-600' : 'bg-slate-700'
                  } border-2`}
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <span className="text-2xl text-white text-center">
                    {currentCard?.back}
                  </span>
                  
                  {!isMastered && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentCard) onMaster(currentCard.id);
                      }}
                      className="mt-6 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors"
                    >
                      ✓ Đã thuộc
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={prev}
                className={`p-3 rounded-xl transition-colors ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ← Trước
              </button>
              
              <button
                onClick={shuffle}
                className={`px-4 py-3 rounded-xl transition-colors ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🔀 Xáo trộn
              </button>
              
              <button
                onClick={next}
                className={`p-3 rounded-xl transition-colors ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tiếp →
              </button>
            </div>
          </>
        )}
      </div>

      {/* All Cards Grid */}
      <div className={`p-4 border-t ${borderClass}`}>
        <h3 className={`font-semibold ${textClass} mb-3`}>Tất cả thẻ:</h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {initialFlashcards.map((card) => (
            <button
              key={card.id}
              onClick={() => {
                const idx = filteredCards.findIndex(f => f.id === card.id);
                if (idx >= 0) {
                  setCurrentIndex(idx);
                  setIsFlipped(false);
                }
              }}
              className={`p-2 rounded-lg text-xs font-mono transition-all ${
                masteredCards.includes(card.id)
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
                  : filteredCards[currentIndex]?.id === card.id
                    ? 'bg-amber-500 text-white'
                    : isDark 
                      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {card.front}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
