import { useState } from 'react';
import { SQLCategory, SQLCommand } from '../data/sqlCategories';
import { CodeRunner } from './CodeRunner';
import { SQLHighlighter } from './SQLHighlighter';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface CategorySectionProps {
  category: SQLCategory;
  isDark: boolean;
  mode: 'easy' | 'technical';
  completedCommands: string[];
  onComplete: (commandId: string) => void;
}

export function CategorySection({ 
  category, 
  isDark, 
  mode, 
  completedCommands,
  onComplete 
}: CategorySectionProps) {
  const [selectedCommand, setSelectedCommand] = useState<SQLCommand | null>(null);
  const [activeTab, setActiveTab] = useState<'learn' | 'practice'>('learn');
  const [showCodeRunner, setShowCodeRunner] = useState(false);
  
  const { speak, isSpeaking, stop } = useTextToSpeech();

  const bgClass = isDark ? 'bg-slate-900' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-slate-800';
  const borderClass = isDark ? 'border-slate-700' : 'border-slate-200';
  const mutedClass = isDark ? 'text-slate-400' : 'text-slate-500';

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  };

  const getExampleCode = (cmd: SQLCommand): string => {
    return cmd.examples.map(ex => ex.code).join('\n\n');
  };

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className={`rounded-2xl bg-gradient-to-r ${category.color} p-6 shadow-xl`}>
        <div className="flex items-center gap-4">
          <span className="text-5xl">{category.icon}</span>
          <div>
            <h2 className="text-2xl font-bold text-white">{category.name}</h2>
            <p className="text-white/80 mt-1">{category.description}</p>
          </div>
        </div>
        
        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-white/80 text-sm mb-2">
            <span>Tiến trình</span>
            <span>
              {completedCommands.filter(c => category.commands.some(cmd => cmd.id === c)).length}
              /{category.commands.length} lệnh
            </span>
          </div>
          <div className="h-2 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ 
                width: `${(completedCommands.filter(c => category.commands.some(cmd => cmd.id === c)).length / category.commands.length) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* Commands Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {category.commands.map(cmd => {
          const isCompleted = completedCommands.includes(cmd.id);
          const isSelected = selectedCommand?.id === cmd.id;
          
          return (
            <button
              key={cmd.id}
              onClick={() => setSelectedCommand(cmd)}
              className={`p-4 rounded-xl text-center transition-all ${
                isSelected
                  ? `bg-gradient-to-r ${category.color} text-white shadow-lg scale-105`
                  : isCompleted
                    ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 text-green-700 dark:text-green-400'
                    : isDark 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <div className="font-mono font-bold text-sm truncate">
                {cmd.name}
              </div>
              {isCompleted && !isSelected && (
                <span className="text-green-500 text-xs">✓ Đã học</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Command Detail */}
      {selectedCommand && (
        <div className={`rounded-2xl ${bgClass} shadow-xl overflow-hidden border ${borderClass}`}>
          {/* Command Header */}
          <div className={`bg-gradient-to-r ${category.color} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white font-mono">
                  {selectedCommand.name}
                </h3>
                <p className="text-white/80 text-sm mt-1">
                  {mode === 'easy' 
                    ? selectedCommand.description.easy 
                    : selectedCommand.description.technical}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSpeak(
                    mode === 'easy' 
                      ? selectedCommand.description.easy 
                      : selectedCommand.description.technical
                  )}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                  title={isSpeaking ? 'Dừng đọc' : 'Đọc mô tả'}
                >
                  {isSpeaking ? '⏹️' : '🔊'}
                </button>
                <button
                  onClick={() => setSelectedCommand(null)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className={`flex border-b ${borderClass}`}>
            <button
              onClick={() => setActiveTab('learn')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'learn'
                  ? `${textClass} border-b-2 border-indigo-500`
                  : mutedClass
              }`}
            >
              📚 Học lý thuyết
            </button>
            <button
              onClick={() => setActiveTab('practice')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'practice'
                  ? `${textClass} border-b-2 border-indigo-500`
                  : mutedClass
              }`}
            >
              ⚡ Thực hành
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'learn' ? (
              <div className="space-y-6">
                {/* Syntax */}
                <div>
                  <h4 className={`font-semibold ${textClass} mb-2 flex items-center gap-2`}>
                    📝 Cú pháp
                  </h4>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'} font-mono text-sm`}>
                    <pre className={isDark ? 'text-green-400' : 'text-slate-700'}>
                      {selectedCommand.syntax}
                    </pre>
                  </div>
                </div>

                {/* Examples */}
                <div>
                  <h4 className={`font-semibold ${textClass} mb-3 flex items-center gap-2`}>
                    💡 Ví dụ
                  </h4>
                  <div className="space-y-4">
                    {selectedCommand.examples.map((example, i) => (
                      <div 
                        key={i} 
                        className={`p-4 rounded-xl border ${borderClass} ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}
                      >
                        <SQLHighlighter sql={example.code} mode={mode} />
                        <p className={`mt-2 text-sm ${mutedClass}`}>
                          👉 {example.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Common Errors */}
                <div>
                  <h4 className={`font-semibold ${textClass} mb-2 flex items-center gap-2`}>
                    ⚠️ Lỗi thường gặp
                  </h4>
                  <ul className="space-y-2">
                    {selectedCommand.commonErrors.map((error, i) => (
                      <li 
                        key={i}
                        className={`flex items-start gap-2 text-sm ${
                          isDark ? 'text-red-400' : 'text-red-600'
                        }`}
                      >
                        <span>❌</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tips */}
                <div>
                  <h4 className={`font-semibold ${textClass} mb-2 flex items-center gap-2`}>
                    💪 Mẹo hay
                  </h4>
                  <ul className="space-y-2">
                    {selectedCommand.tips.map((tip, i) => (
                      <li 
                        key={i}
                        className={`flex items-start gap-2 text-sm ${
                          isDark ? 'text-green-400' : 'text-green-600'
                        }`}
                      >
                        <span>✅</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mark as complete */}
                {!completedCommands.includes(selectedCommand.id) && (
                  <button
                    onClick={() => onComplete(selectedCommand.id)}
                    className={`w-full py-3 bg-gradient-to-r ${category.color} text-white rounded-xl font-semibold hover:opacity-90 transition-all`}
                  >
                    ✓ Đánh dấu đã học
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className={`font-semibold ${textClass}`}>
                    ⚡ Chạy code từng dòng
                  </h4>
                  <button
                    onClick={() => setShowCodeRunner(!showCodeRunner)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      showCodeRunner
                        ? 'bg-indigo-500 text-white'
                        : isDark 
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {showCodeRunner ? '🔽 Ẩn' : '▶️ Mở Code Runner'}
                  </button>
                </div>

                {showCodeRunner && (
                  <CodeRunner
                    code={getExampleCode(selectedCommand)}
                    isDark={isDark}
                    mode={mode}
                  />
                )}

                {!showCodeRunner && (
                  <div className={`text-center py-12 ${mutedClass}`}>
                    <span className="text-5xl">⚡</span>
                    <p className="mt-4">Nhấn "Mở Code Runner" để thực hành chạy từng dòng SQL</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
