import { useState, useEffect } from 'react';
import { useSQLEngine } from '../hooks/useSQLEngine';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { sampleDatabases } from '../data/database';
import { SQLHighlighter } from './SQLHighlighter';

interface SQLPlaygroundProps {
  mode: 'easy' | 'technical';
  isDark: boolean;
}

export function SQLPlayground({ mode, isDark }: SQLPlaygroundProps) {
  const [sql, setSQL] = useState('SELECT * FROM students');
  const [result, setResult] = useState<{ columns: string[]; rows: (string | number | null)[][]; error?: string; executionTime?: number } | null>(null);
  const [selectedTable, setSelectedTable] = useState('students');
  const [history, setHistory] = useState<string[]>([]);
  const { executeSQL, resetDB, isReady } = useSQLEngine();
  const { speakSQL, isSpeaking, stop } = useTextToSpeech();

  const handleRun = () => {
    const queryResult = executeSQL(sql);
    setResult(queryResult);
    
    if (!queryResult.error && !history.includes(sql)) {
      setHistory(prev => [sql, ...prev].slice(0, 10));
    }
  };

  const handleReset = () => {
    resetDB();
    setResult(null);
    setSQL('SELECT * FROM students');
  };

  const loadTablePreview = (tableName: string) => {
    setSelectedTable(tableName);
    setSQL(`SELECT * FROM ${tableName}`);
  };

  useEffect(() => {
    if (isReady) {
      handleRun();
    }
  }, [isReady]);

  const bgClass = isDark ? 'bg-slate-900' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-slate-800';
  const borderClass = isDark ? 'border-slate-700' : 'border-slate-200';

  return (
    <div className={`rounded-2xl ${bgClass} shadow-xl overflow-hidden border ${borderClass}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🧪</span>
          <div>
            <h2 className="text-xl font-bold text-white">SQL Sandbox</h2>
            <p className="text-emerald-100 text-sm">Chạy SQL thật với database mẫu</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors"
          >
            🔄 Reset DB
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* Left: Tables */}
        <div className={`p-4 border-r ${borderClass}`}>
          <h3 className={`font-semibold ${textClass} mb-3 flex items-center gap-2`}>
            <span>📊</span> Database mẫu
          </h3>
          
          <div className="space-y-2">
            {Object.entries(sampleDatabases).map(([key, table]) => (
              <button
                key={key}
                onClick={() => loadTablePreview(key)}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  selectedTable === key
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 border-2 border-emerald-500'
                    : `${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'} border-2 border-transparent`
                }`}
              >
                <div className={`font-mono font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {table.name}
                </div>
                <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {table.description}
                </div>
                <div className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {table.columns.join(', ')}
                </div>
              </button>
            ))}
          </div>

          {/* Query History */}
          {history.length > 0 && (
            <div className="mt-6">
              <h4 className={`font-semibold ${textClass} mb-2 flex items-center gap-2`}>
                <span>📜</span> Lịch sử
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {history.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setSQL(q)}
                    className={`w-full p-2 text-xs font-mono text-left rounded ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    } truncate`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Middle: Editor */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${textClass} flex items-center gap-2`}>
              <span>✏️</span> SQL Editor
            </h3>
            <button
              onClick={() => isSpeaking ? stop() : speakSQL(sql)}
              className={`p-2 rounded-lg transition-colors ${
                isSpeaking 
                  ? 'bg-red-100 text-red-600' 
                  : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title={isSpeaking ? 'Dừng đọc' : 'Đọc câu SQL'}
            >
              {isSpeaking ? '⏹️' : '🔊'}
            </button>
          </div>

          <div className="mb-4">
            <SQLHighlighter sql={sql} mode={mode} />
          </div>

          <textarea
            value={sql}
            onChange={(e) => setSQL(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                handleRun();
              }
            }}
            className={`w-full h-32 p-3 rounded-xl font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              isDark ? 'bg-slate-800 text-green-400 border-slate-700' : 'bg-slate-50 text-slate-800 border-slate-200'
            } border`}
            placeholder="Nhập câu lệnh SQL..."
          />

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleRun}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2"
            >
              <span>▶</span> Chạy (Ctrl+Enter)
            </button>
            <button
              onClick={() => setSQL('')}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all ${
                isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Xóa
            </button>
          </div>

          {/* Quick Examples */}
          <div className="mt-4">
            <h4 className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-2`}>
              Thử nhanh:
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                'SELECT * FROM students',
                'SELECT * FROM products WHERE price > 20000000',
                'SELECT COUNT(*) FROM orders',
                'SELECT department, AVG(salary) FROM employees GROUP BY department',
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => setSQL(example)}
                  className={`px-2 py-1 text-xs rounded-lg font-mono ${
                    isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {example.length > 30 ? example.slice(0, 30) + '...' : example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className={`p-4 border-l ${borderClass}`}>
          <h3 className={`font-semibold ${textClass} mb-3 flex items-center gap-2`}>
            <span>📋</span> Kết quả
            {result?.executionTime && (
              <span className={`text-xs font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                ({result.executionTime}ms)
              </span>
            )}
          </h3>

          {result?.error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="text-red-600 dark:text-red-400 whitespace-pre-wrap text-sm">
                {result.error}
              </div>
              
              {/* Error explanation for "learn from errors" */}
              <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">
                  💡 Gợi ý sửa lỗi:
                </h4>
                <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                  <li>• Kiểm tra lại tên bảng và cột</li>
                  <li>• Đảm bảo cú pháp SQL đúng</li>
                  <li>• Chuỗi phải có dấu nháy đơn</li>
                </ul>
              </div>
            </div>
          ) : result?.columns.length ? (
            <div className="overflow-auto max-h-80 rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                  <tr>
                    {result.columns.map((col, i) => (
                      <th key={i} className={`px-3 py-2 text-left font-semibold ${textClass} border-b ${borderClass}`}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? '' : isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
                      {row.map((cell, j) => (
                        <td key={j} className={`px-3 py-2 ${isDark ? 'text-slate-300' : 'text-slate-600'} border-b ${borderClass}`}>
                          {cell === null ? <span className="text-slate-400 italic">NULL</span> : String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <span className="text-4xl">📭</span>
              <p className="mt-2">Chưa có kết quả</p>
            </div>
          )}

          {result && !result.error && (
            <div className={`mt-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              📊 {result.rows.length} hàng
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
