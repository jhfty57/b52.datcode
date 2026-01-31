import { useState } from 'react';
import { Lesson } from '../types';
import { SQLHighlighter } from './SQLHighlighter';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useSQLEngine } from '../hooks/useSQLEngine';
import { sqlKeywordExplanations } from '../data/database';

interface LessonReaderProps {
  lesson: Lesson;
  mode: 'easy' | 'technical';
  isDark: boolean;
  onKeywordClick?: (keyword: string) => void;
}

export function LessonReader({ lesson, mode, isDark, onKeywordClick }: LessonReaderProps) {
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [editableSql, setEditableSql] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, { columns: string[]; rows: (string | number | null)[][]; error?: string }>>({});
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  
  const { speak, speakSQL, isSpeaking, stop, rate, setRate } = useTextToSpeech();
  const { executeSQL } = useSQLEngine();

  const handleRunCode = (index: number, sql: string) => {
    const result = executeSQL(sql);
    setResults(prev => ({ ...prev, [index]: result }));
  };

  const handleSpeakLesson = () => {
    if (isSpeaking) {
      stop();
      return;
    }

    const textContent = lesson.content
      .map(item => {
        if (item.type === 'text') return item.content.replace(/\*\*/g, '');
        if (item.type === 'sql') return `Câu lệnh SQL: ${item.content}. ${item.explanation || ''}`;
        return '';
      })
      .join('. ');

    speak(textContent);
  };

  const handleKeywordClickInternal = (keyword: string) => {
    setActiveKeyword(keyword);
    onKeywordClick?.(keyword);
  };

  const bgClass = isDark ? 'bg-slate-900' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-slate-800';
  const borderClass = isDark ? 'border-slate-700' : 'border-slate-200';
  const mutedClass = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`rounded-2xl ${bgClass} shadow-xl overflow-hidden border ${borderClass}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{lesson.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-white">{lesson.title}</h2>
              <p className="text-indigo-100 text-sm">{lesson.description}</p>
            </div>
          </div>

          {/* TTS Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeakLesson}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isSpeaking
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {isSpeaking ? '⏹️ Dừng' : '🔊 Đọc bài'}
            </button>
            
            <div className="flex items-center gap-1 bg-white/20 rounded-lg px-2 py-1">
              <span className="text-white text-xs">Tốc độ:</span>
              <select
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="bg-transparent text-white text-sm outline-none cursor-pointer"
              >
                <option value={0.5} className="text-black">0.5x</option>
                <option value={0.75} className="text-black">0.75x</option>
                <option value={1} className="text-black">1x</option>
                <option value={1.25} className="text-black">1.25x</option>
                <option value={1.5} className="text-black">1.5x</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {lesson.content.map((item, index) => (
          <div 
            key={index}
            className={`transition-all ${currentLine === index ? 'ring-2 ring-indigo-500 rounded-xl' : ''}`}
            onClick={() => setCurrentLine(index)}
          >
            {item.type === 'text' && (
              <div className={`${textClass} leading-relaxed`}>
                {item.content.split('**').map((part, i) => 
                  i % 2 === 1 ? (
                    <span 
                      key={i} 
                      className="font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline"
                      onClick={() => handleKeywordClickInternal(part)}
                    >
                      {part}
                    </span>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </div>
            )}

            {item.type === 'sql' && (
              <div className="space-y-3">
                {/* SQL Code Block */}
                <div className="relative">
                  <SQLHighlighter 
                    sql={editableSql[index] ?? item.content} 
                    mode={mode}
                    onKeywordClick={handleKeywordClickInternal}
                    highlightLine={currentLine === index ? 0 : undefined}
                  />
                  
                  {/* Speak SQL button */}
                  <button
                    onClick={() => speakSQL(item.content, item.explanation)}
                    className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    title="Đọc câu SQL này"
                  >
                    🔊
                  </button>
                </div>

                {/* Explanation */}
                {item.explanation && (
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-indigo-900/30 border-indigo-800' : 'bg-indigo-50 border-indigo-200'} border`}>
                    <div className="flex items-start gap-2">
                      <span className="text-xl">💡</span>
                      <p className={mutedClass}>{item.explanation}</p>
                    </div>
                  </div>
                )}

                {/* Runnable SQL */}
                {item.runnable && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editableSql[index] ?? item.content}
                        onChange={(e) => setEditableSql(prev => ({ ...prev, [index]: e.target.value }))}
                        className={`flex-1 px-3 py-2 rounded-lg font-mono text-sm ${
                          isDark ? 'bg-slate-800 text-green-400 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-200'
                        } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      />
                      <button
                        onClick={() => handleRunCode(index, editableSql[index] ?? item.content)}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2"
                      >
                        ▶ Chạy
                      </button>
                    </div>

                    {/* Result */}
                    {results[index] && (
                      <div className={`rounded-xl overflow-hidden border ${borderClass} animate-fade-in`}>
                        {results[index].error ? (
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                            {results[index].error}
                          </div>
                        ) : (
                          <div className="overflow-auto max-h-40">
                            <table className="w-full text-sm">
                              <thead className={`${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                <tr>
                                  {results[index].columns.map((col, i) => (
                                    <th key={i} className={`px-3 py-2 text-left font-semibold ${textClass}`}>
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {results[index].rows.map((row, i) => (
                                  <tr key={i} className={i % 2 === 0 ? '' : isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
                                    {row.map((cell, j) => (
                                      <td key={j} className={`px-3 py-2 ${mutedClass}`}>
                                        {cell === null ? <span className="italic">NULL</span> : String(cell)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Keywords Panel */}
      <div className={`p-4 border-t ${borderClass} ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
        <h3 className={`font-semibold ${textClass} mb-3 flex items-center gap-2`}>
          <span>🔑</span> Từ khóa trong bài
        </h3>
        <div className="flex flex-wrap gap-2">
          {lesson.keywords.map(kw => (
            <button
              key={kw.keyword}
              onClick={() => handleKeywordClickInternal(kw.keyword)}
              className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-all ${
                activeKeyword === kw.keyword
                  ? 'bg-indigo-500 text-white'
                  : isDark 
                    ? 'bg-slate-700 text-indigo-400 hover:bg-slate-600' 
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              }`}
            >
              {kw.keyword}
            </button>
          ))}
        </div>
      </div>

      {/* Keyword Detail Modal */}
      {activeKeyword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setActiveKeyword(null)}>
          <div 
            className={`max-w-lg w-full ${bgClass} rounded-2xl shadow-2xl overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
              <h3 className="text-xl font-bold text-white font-mono">{activeKeyword}</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h4 className={`font-semibold ${textClass} mb-2 flex items-center gap-2`}>
                  {mode === 'easy' ? '🟢 Dễ hiểu:' : '🔵 Kỹ thuật:'}
                </h4>
                <p className={mutedClass}>
                  {mode === 'easy' 
                    ? (sqlKeywordExplanations[activeKeyword]?.easy || lesson.keywords.find(k => k.keyword === activeKeyword)?.meaningEasy)
                    : (sqlKeywordExplanations[activeKeyword]?.technical || lesson.keywords.find(k => k.keyword === activeKeyword)?.meaningTechnical)
                  }
                </p>
              </div>

              <div>
                <h4 className={`font-semibold ${textClass} mb-2`}>📝 Ví dụ:</h4>
                <code className={`block p-3 rounded-lg ${isDark ? 'bg-slate-800 text-green-400' : 'bg-slate-100 text-slate-800'} font-mono text-sm`}>
                  {sqlKeywordExplanations[activeKeyword]?.example || lesson.keywords.find(k => k.keyword === activeKeyword)?.example}
                </code>
              </div>

              {sqlKeywordExplanations[activeKeyword]?.errors && (
                <div>
                  <h4 className={`font-semibold ${textClass} mb-2`}>⚠️ Lỗi thường gặp:</h4>
                  <ul className={`list-disc list-inside space-y-1 ${mutedClass}`}>
                    {sqlKeywordExplanations[activeKeyword].errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setActiveKeyword(null)}
                className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
