import { useState, useEffect, useRef } from 'react';
import { useSQLEngine } from '../hooks/useSQLEngine';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface CodeRunnerProps {
  code: string;
  isDark: boolean;
  mode: 'easy' | 'technical';
  onLineChange?: (line: number) => void;
}

interface LineExecution {
  line: number;
  sql: string;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: { columns: string[]; rows: (string | number | null)[][]; error?: string };
  time?: number;
}

export function CodeRunner({ code, isDark, mode, onLineChange }: CodeRunnerProps) {
  const [lines, setLines] = useState<LineExecution[]>([]);
  const [currentLine, setCurrentLine] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const [speed, setSpeed] = useState(1000); // ms between lines
  const [editedCode, setEditedCode] = useState(code);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { executeSQL, resetDB } = useSQLEngine();
  const { speak, isSpeaking, stop: stopSpeak } = useTextToSpeech();

  // Parse code into lines
  useEffect(() => {
    const sqlLines = editedCode
      .split(/;\s*\n|;\s*$/)
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith('--'))
      .map((sql, i) => ({
        line: i,
        sql: sql + ';',
        status: 'pending' as const,
      }));
    setLines(sqlLines);
    setCurrentLine(-1);
  }, [editedCode]);

  // Update code when prop changes
  useEffect(() => {
    setEditedCode(code);
  }, [code]);

  // Auto-run effect
  useEffect(() => {
    if (autoRun && isRunning && currentLine < lines.length - 1) {
      timerRef.current = setTimeout(() => {
        runNextLine();
      }, speed);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [autoRun, isRunning, currentLine, lines.length, speed]);

  const runLine = (index: number) => {
    if (index >= lines.length) {
      setIsRunning(false);
      return;
    }

    setCurrentLine(index);
    onLineChange?.(index);

    // Update status to running
    setLines(prev => prev.map((l, i) => 
      i === index ? { ...l, status: 'running' } : l
    ));

    // Execute SQL
    const startTime = performance.now();
    const result = executeSQL(lines[index].sql);
    const endTime = performance.now();

    // Update with result
    setLines(prev => prev.map((l, i) => 
      i === index ? {
        ...l,
        status: result.error ? 'error' : 'success',
        result,
        time: Math.round(endTime - startTime),
      } : l
    ));

    // Speak explanation if enabled
    if (mode === 'easy') {
      const explanation = getLineExplanation(lines[index].sql);
      if (explanation && !isSpeaking) {
        speak(explanation);
      }
    }
  };

  const runNextLine = () => {
    runLine(currentLine + 1);
  };

  const runAll = () => {
    resetDB();
    setLines(prev => prev.map(l => ({ ...l, status: 'pending', result: undefined })));
    setCurrentLine(-1);
    setIsRunning(true);
    setAutoRun(true);
    setTimeout(() => runLine(0), 100);
  };

  const runStep = () => {
    if (currentLine === -1) {
      resetDB();
      setLines(prev => prev.map(l => ({ ...l, status: 'pending', result: undefined })));
    }
    setAutoRun(false);
    setIsRunning(true);
    runLine(currentLine + 1);
  };

  const pauseRun = () => {
    setAutoRun(false);
    setIsRunning(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const resetRun = () => {
    pauseRun();
    stopSpeak();
    resetDB();
    setCurrentLine(-1);
    setLines(prev => prev.map(l => ({ ...l, status: 'pending', result: undefined, time: undefined })));
  };

  const getLineExplanation = (sql: string): string => {
    const upper = sql.toUpperCase();
    if (upper.startsWith('CREATE DATABASE')) return 'Tạo database mới';
    if (upper.startsWith('CREATE TABLE')) return 'Tạo bảng mới với các cột';
    if (upper.startsWith('CREATE INDEX')) return 'Tạo index để tìm kiếm nhanh hơn';
    if (upper.startsWith('ALTER TABLE')) return 'Thay đổi cấu trúc bảng';
    if (upper.startsWith('DROP TABLE')) return 'Xóa bảng khỏi database';
    if (upper.startsWith('TRUNCATE')) return 'Xóa toàn bộ dữ liệu trong bảng';
    if (upper.startsWith('SELECT')) return 'Truy vấn lấy dữ liệu';
    if (upper.startsWith('INSERT')) return 'Thêm dữ liệu mới vào bảng';
    if (upper.startsWith('UPDATE')) return 'Cập nhật dữ liệu trong bảng';
    if (upper.startsWith('DELETE')) return 'Xóa dữ liệu khỏi bảng';
    if (upper.startsWith('GRANT')) return 'Cấp quyền cho user';
    if (upper.startsWith('REVOKE')) return 'Thu hồi quyền của user';
    return 'Thực thi câu lệnh SQL';
  };

  const bgClass = isDark ? 'bg-slate-900' : 'bg-white';
  const borderClass = isDark ? 'border-slate-700' : 'border-slate-200';
  const textClass = isDark ? 'text-white' : 'text-slate-800';
  const mutedClass = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`rounded-2xl ${bgClass} shadow-xl overflow-hidden border ${borderClass}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h3 className="text-white font-bold">Chạy Code Từng Dòng</h3>
              <p className="text-indigo-100 text-sm">
                {lines.length} câu lệnh • Line by line execution
              </p>
            </div>
          </div>

          {/* Speed control */}
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">Tốc độ:</span>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bg-white/20 text-white rounded px-2 py-1 text-sm outline-none"
            >
              <option value={2000} className="text-black">0.5x</option>
              <option value={1000} className="text-black">1x</option>
              <option value={500} className="text-black">2x</option>
              <option value={250} className="text-black">4x</option>
            </select>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={runAll}
            disabled={isRunning && autoRun}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            ▶️ Chạy tất cả
          </button>
          <button
            onClick={runStep}
            disabled={currentLine >= lines.length - 1}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            ⏭️ Từng bước
          </button>
          {isRunning && autoRun && (
            <button
              onClick={pauseRun}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              ⏸️ Tạm dừng
            </button>
          )}
          <button
            onClick={resetRun}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            🔄 Reset
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${((currentLine + 1) / lines.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Code Editor */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${textClass}`}>📝 Chỉnh sửa SQL:</span>
          <button
            onClick={() => setEditedCode(code)}
            className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
          >
            Reset code
          </button>
        </div>
        <textarea
          value={editedCode}
          onChange={(e) => setEditedCode(e.target.value)}
          className={`w-full h-32 p-3 rounded-lg font-mono text-sm resize-none ${
            isDark ? 'bg-slate-800 text-green-400 border-slate-700' : 'bg-slate-50 text-slate-800 border-slate-200'
          } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          spellCheck={false}
        />
      </div>

      {/* Lines execution */}
      <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-[500px] overflow-auto">
        {lines.map((line, index) => (
          <div 
            key={index}
            className={`p-4 transition-all ${
              index === currentLine 
                ? isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'
                : ''
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Line number & status */}
              <div className="flex items-center gap-2 min-w-[80px]">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  line.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
                  line.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' :
                  line.status === 'running' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400 animate-pulse' :
                  isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-600'
                }`}>
                  {line.status === 'success' ? '✓' :
                   line.status === 'error' ? '✗' :
                   line.status === 'running' ? '...' :
                   index + 1}
                </span>
                {line.time !== undefined && (
                  <span className={`text-xs ${mutedClass}`}>{line.time}ms</span>
                )}
              </div>

              {/* SQL code */}
              <div className="flex-1 min-w-0">
                <code className={`block font-mono text-sm whitespace-pre-wrap ${
                  line.status === 'error' ? 'text-red-500' :
                  line.status === 'success' ? isDark ? 'text-green-400' : 'text-green-600' :
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {highlightSQL(line.sql, isDark)}
                </code>

                {/* Explanation */}
                <p className={`text-xs mt-1 ${mutedClass}`}>
                  {getLineExplanation(line.sql)}
                </p>

                {/* Result */}
                {line.result && (
                  <div className="mt-2">
                    {line.result.error ? (
                      <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                        {line.result.error}
                      </div>
                    ) : line.result.columns.length > 0 && line.result.rows.length > 0 ? (
                      <div className="overflow-auto max-h-40 rounded-lg border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-xs">
                          <thead className={isDark ? 'bg-slate-800' : 'bg-slate-100'}>
                            <tr>
                              {line.result.columns.map((col, i) => (
                                <th key={i} className={`px-2 py-1 text-left font-semibold ${textClass}`}>
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {line.result.rows.slice(0, 5).map((row, i) => (
                              <tr key={i} className={i % 2 === 0 ? '' : isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
                                {row.map((cell, j) => (
                                  <td key={j} className={`px-2 py-1 ${mutedClass}`}>
                                    {cell === null ? <span className="italic">NULL</span> : String(cell)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {line.result.rows.length > 5 && (
                          <div className={`px-2 py-1 text-xs ${mutedClass}`}>
                            ... và {line.result.rows.length - 5} hàng nữa
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                        ✓ Thành công
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Run single line */}
              <button
                onClick={() => runLine(index)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
                title="Chạy dòng này"
              >
                ▶
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {currentLine >= 0 && (
        <div className={`p-4 border-t ${borderClass} ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className={`text-sm ${mutedClass}`}>
                  {lines.filter(l => l.status === 'success').length} thành công
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className={`text-sm ${mutedClass}`}>
                  {lines.filter(l => l.status === 'error').length} lỗi
                </span>
              </span>
            </div>
            <span className={`text-sm ${mutedClass}`}>
              Tổng thời gian: {lines.reduce((acc, l) => acc + (l.time || 0), 0)}ms
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to highlight SQL keywords
function highlightSQL(sql: string, _isDark: boolean): React.ReactNode {
  // This is a simplified approach - just return the SQL with basic formatting
  // In a real app, you'd use a proper tokenizer
  void _isDark; // Mark as used
  return <span>{sql}</span>;
}
