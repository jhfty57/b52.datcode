import { useState, useEffect, useRef } from 'react';

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

export function SQLEditor({ value, onChange, onSubmit, placeholder }: SQLEditorProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sqlKeywordsList = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'ASC', 'DESC',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
    'LIMIT', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
    'GROUP BY', 'HAVING', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
    '*', 'students', 'name', 'age', 'grade', 'id'
  ];

  useEffect(() => {
    const words = value.split(/\s+/);
    const lastWord = words[words.length - 1]?.toUpperCase() || '';
    
    if (lastWord.length > 0) {
      const filtered = sqlKeywordsList.filter(kw => 
        kw.toUpperCase().startsWith(lastWord) && kw.toUpperCase() !== lastWord
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  }, [value]);

  const applySuggestion = (suggestion: string) => {
    const words = value.split(/\s+/);
    words[words.length - 1] = suggestion;
    onChange(words.join(' ') + ' ');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          applySuggestion(suggestions[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    } else if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative">
      <div className="relative bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
        {/* Editor header */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-slate-400 text-sm ml-2">SQL Editor</span>
        </div>
        
        {/* Editor body */}
        <div className="relative p-4">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Nhập câu lệnh SQL..."}
            className="w-full h-32 bg-transparent text-green-400 font-mono text-lg resize-none outline-none placeholder-slate-600"
            spellCheck={false}
          />
          
          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-4 bottom-4 translate-y-full bg-slate-800 rounded-lg shadow-xl border border-slate-600 overflow-hidden z-20">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  onClick={() => applySuggestion(suggestion)}
                  className={`w-full px-4 py-2 text-left font-mono text-sm transition-colors ${
                    index === selectedIndex 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span className="text-yellow-400">{suggestion}</span>
                </button>
              ))}
              <div className="px-4 py-1 bg-slate-900 text-xs text-slate-500">
                ↑↓ để chọn, Tab để áp dụng
              </div>
            </div>
          )}
        </div>
        
        {/* Run button */}
        <div className="flex justify-between items-center px-4 py-3 bg-slate-800 border-t border-slate-700">
          <span className="text-xs text-slate-500">Ctrl+Enter để chạy</span>
          <button
            onClick={onSubmit}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-green-500/25 flex items-center gap-2"
          >
            <span>▶</span>
            Chạy
          </button>
        </div>
      </div>
    </div>
  );
}
