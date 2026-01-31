import { useState } from 'react';
import { sqlKeywordExplanations } from '../data/database';

interface SQLHighlighterProps {
  sql: string;
  mode: 'easy' | 'technical';
  onKeywordClick?: (keyword: string) => void;
  highlightLine?: number;
}

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE',
  'ORDER BY', 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'DISTINCT',
  'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
  'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'ON',
  'GROUP BY', 'HAVING', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
  'CREATE TABLE', 'DROP TABLE', 'ALTER TABLE',
  'PRIMARY KEY', 'FOREIGN KEY', 'INDEX', 'AS', 'NULL'
];

export function SQLHighlighter({ sql, mode, onKeywordClick, highlightLine }: SQLHighlighterProps) {
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleKeywordHover = (keyword: string, e: React.MouseEvent) => {
    setActiveKeyword(keyword);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleKeywordLeave = () => {
    setActiveKeyword(null);
  };

  const handleKeywordClickInternal = (keyword: string) => {
    onKeywordClick?.(keyword);
  };

  // Tokenize SQL
  const tokenize = (sqlText: string) => {
    const tokens: { type: 'keyword' | 'string' | 'number' | 'operator' | 'text'; value: string; keyword?: string }[] = [];
    let remaining = sqlText;

    while (remaining.length > 0) {
      let matched = false;

      // Check for multi-word keywords first
      for (const kw of SQL_KEYWORDS.sort((a, b) => b.length - a.length)) {
        const pattern = new RegExp(`^(${kw.replace(/\s+/g, '\\s+')})\\b`, 'i');
        const match = remaining.match(pattern);
        if (match) {
          tokens.push({ type: 'keyword', value: match[1], keyword: kw.toUpperCase() });
          remaining = remaining.slice(match[1].length);
          matched = true;
          break;
        }
      }

      if (matched) continue;

      // String literals
      const stringMatch = remaining.match(/^('[^']*'|"[^"]*")/);
      if (stringMatch) {
        tokens.push({ type: 'string', value: stringMatch[1] });
        remaining = remaining.slice(stringMatch[1].length);
        continue;
      }

      // Numbers
      const numMatch = remaining.match(/^(\d+\.?\d*)/);
      if (numMatch) {
        tokens.push({ type: 'number', value: numMatch[1] });
        remaining = remaining.slice(numMatch[1].length);
        continue;
      }

      // Operators
      const opMatch = remaining.match(/^([<>=!]+|[*,();])/);
      if (opMatch) {
        tokens.push({ type: 'operator', value: opMatch[1] });
        remaining = remaining.slice(opMatch[1].length);
        continue;
      }

      // Whitespace and other text
      const textMatch = remaining.match(/^(\s+|\w+)/);
      if (textMatch) {
        tokens.push({ type: 'text', value: textMatch[1] });
        remaining = remaining.slice(textMatch[1].length);
        continue;
      }

      // Single character fallback
      tokens.push({ type: 'text', value: remaining[0] });
      remaining = remaining.slice(1);
    }

    return tokens;
  };

  const tokens = tokenize(sql);
  const lines = sql.split('\n');

  const getKeywordInfo = (keyword: string) => {
    const info = sqlKeywordExplanations[keyword.toUpperCase()];
    if (!info) return null;
    return mode === 'easy' ? info.easy : info.technical;
  };

  return (
    <div className="relative font-mono text-sm">
      {/* SQL Display */}
      <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
        <pre className="text-white">
          {tokens.map((token, index) => {
            const colorClass = 
              token.type === 'keyword' ? 'text-purple-400 font-bold cursor-pointer hover:text-purple-300 hover:underline' :
              token.type === 'string' ? 'text-green-400' :
              token.type === 'number' ? 'text-yellow-400' :
              token.type === 'operator' ? 'text-pink-400' :
              'text-slate-300';

            if (token.type === 'keyword' && token.keyword) {
              return (
                <span
                  key={index}
                  className={colorClass}
                  onMouseEnter={(e) => handleKeywordHover(token.keyword!, e)}
                  onMouseLeave={handleKeywordLeave}
                  onClick={() => handleKeywordClickInternal(token.keyword!)}
                >
                  {token.value}
                </span>
              );
            }

            return (
              <span key={index} className={colorClass}>
                {token.value}
              </span>
            );
          })}
        </pre>

        {/* Line numbers for multi-line */}
        {lines.length > 1 && (
          <div className="absolute left-0 top-4 flex flex-col text-slate-600 text-xs select-none pr-2 border-r border-slate-700">
            {lines.map((_, i) => (
              <span 
                key={i} 
                className={`px-2 ${highlightLine === i ? 'bg-yellow-500/20 text-yellow-400' : ''}`}
              >
                {i + 1}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tooltip */}
      {activeKeyword && (
        <div
          className="fixed z-50 max-w-xs bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-600 text-sm"
          style={{
            left: Math.min(tooltipPos.x + 10, window.innerWidth - 300),
            top: tooltipPos.y + 20,
          }}
        >
          <div className="font-bold text-purple-400 mb-1">{activeKeyword}</div>
          <div className="text-slate-300">
            {getKeywordInfo(activeKeyword) || 'Từ khóa SQL'}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            💡 Nhấn để xem chi tiết
          </div>
        </div>
      )}
    </div>
  );
}
