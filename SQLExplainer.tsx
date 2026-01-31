import { useState } from 'react';
import { SQLHighlighter } from './SQLHighlighter';
import { sqlKeywordExplanations } from '../data/database';

interface SQLExplainerProps {
  isDark: boolean;
  mode: 'easy' | 'technical';
}

interface SQLPart {
  type: string;
  content: string;
  explanation: string;
}

export function SQLExplainer({ isDark, mode }: SQLExplainerProps) {
  const [sql, setSQL] = useState('');
  const [parts, setParts] = useState<SQLPart[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeSQL = () => {
    if (!sql.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const analyzed = parseSQLParts(sql, mode);
      setParts(analyzed);
      setIsAnalyzing(false);
    }, 500);
  };

  const parseSQLParts = (sqlText: string, explainMode: 'easy' | 'technical'): SQLPart[] => {
    const result: SQLPart[] = [];
    const upperSQL = sqlText.toUpperCase();
    
    // Parse SELECT
    if (upperSQL.includes('SELECT')) {
      const selectMatch = sqlText.match(/SELECT\s+(.*?)\s+FROM/i);
      if (selectMatch) {
        const explanation = explainMode === 'easy'
          ? `🎯 Chọn các cột: ${selectMatch[1] === '*' ? 'TẤT CẢ các cột' : selectMatch[1]}`
          : `SELECT clause: Specifies columns ${selectMatch[1]} to be returned in the result set`;
        result.push({ type: 'SELECT', content: `SELECT ${selectMatch[1]}`, explanation });
      }
    }

    // Parse FROM
    const fromMatch = sqlText.match(/FROM\s+(\w+)/i);
    if (fromMatch) {
      const explanation = explainMode === 'easy'
        ? `📋 Lấy dữ liệu từ bảng: ${fromMatch[1]}`
        : `FROM clause: Specifies the source table "${fromMatch[1]}" for the query`;
      result.push({ type: 'FROM', content: `FROM ${fromMatch[1]}`, explanation });
    }

    // Parse WHERE
    const whereMatch = sqlText.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+GROUP|\s+LIMIT|$)/i);
    if (whereMatch) {
      const explanation = explainMode === 'easy'
        ? `🔍 Lọc với điều kiện: ${whereMatch[1]}`
        : `WHERE clause: Filters rows based on condition "${whereMatch[1]}"`;
      result.push({ type: 'WHERE', content: `WHERE ${whereMatch[1]}`, explanation });
    }

    // Parse ORDER BY
    const orderMatch = sqlText.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
    if (orderMatch) {
      const direction = orderMatch[2]?.toUpperCase() === 'DESC' ? 'giảm dần' : 'tăng dần';
      const explanation = explainMode === 'easy'
        ? `📊 Sắp xếp theo ${orderMatch[1]} (${direction})`
        : `ORDER BY clause: Sorts result by column "${orderMatch[1]}" in ${orderMatch[2] || 'ASC'} order`;
      result.push({ type: 'ORDER BY', content: `ORDER BY ${orderMatch[1]} ${orderMatch[2] || ''}`.trim(), explanation });
    }

    // Parse GROUP BY
    const groupMatch = sqlText.match(/GROUP\s+BY\s+(\w+)/i);
    if (groupMatch) {
      const explanation = explainMode === 'easy'
        ? `📦 Nhóm theo: ${groupMatch[1]}`
        : `GROUP BY clause: Groups rows by column "${groupMatch[1]}" for aggregation`;
      result.push({ type: 'GROUP BY', content: `GROUP BY ${groupMatch[1]}`, explanation });
    }

    // Parse JOIN
    const joinMatch = sqlText.match(/((?:INNER|LEFT|RIGHT|FULL)?\s*JOIN)\s+(\w+)\s+ON\s+(.+?)(?:\s+WHERE|\s+ORDER|\s+GROUP|$)/i);
    if (joinMatch) {
      const explanation = explainMode === 'easy'
        ? `🔗 Kết nối với bảng ${joinMatch[2]} dựa trên: ${joinMatch[3]}`
        : `${joinMatch[1].trim()} clause: Combines rows from "${joinMatch[2]}" based on condition "${joinMatch[3]}"`;
      result.push({ type: 'JOIN', content: `${joinMatch[1]} ${joinMatch[2]} ON ${joinMatch[3]}`, explanation });
    }

    // Parse LIMIT
    const limitMatch = sqlText.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      const explanation = explainMode === 'easy'
        ? `🔢 Chỉ lấy ${limitMatch[1]} kết quả đầu tiên`
        : `LIMIT clause: Restricts output to first ${limitMatch[1]} rows`;
      result.push({ type: 'LIMIT', content: `LIMIT ${limitMatch[1]}`, explanation });
    }

    // Parse INSERT
    const insertMatch = sqlText.match(/INSERT\s+INTO\s+(\w+)/i);
    if (insertMatch) {
      const explanation = explainMode === 'easy'
        ? `➕ Thêm dữ liệu mới vào bảng: ${insertMatch[1]}`
        : `INSERT INTO clause: Adds new row(s) to table "${insertMatch[1]}"`;
      result.push({ type: 'INSERT', content: `INSERT INTO ${insertMatch[1]}`, explanation });
    }

    // Parse UPDATE
    const updateMatch = sqlText.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE|$)/i);
    if (updateMatch) {
      const explanation = explainMode === 'easy'
        ? `✏️ Cập nhật bảng ${updateMatch[1]}: ${updateMatch[2]}`
        : `UPDATE clause: Modifies existing rows in "${updateMatch[1]}" with values "${updateMatch[2]}"`;
      result.push({ type: 'UPDATE', content: `UPDATE ${updateMatch[1]} SET ${updateMatch[2]}`, explanation });
    }

    // Parse DELETE
    const deleteMatch = sqlText.match(/DELETE\s+FROM\s+(\w+)/i);
    if (deleteMatch) {
      const explanation = explainMode === 'easy'
        ? `🗑️ Xóa dữ liệu từ bảng: ${deleteMatch[1]}`
        : `DELETE FROM clause: Removes rows from table "${deleteMatch[1]}"`;
      result.push({ type: 'DELETE', content: `DELETE FROM ${deleteMatch[1]}`, explanation });
    }

    if (result.length === 0) {
      result.push({
        type: 'Unknown',
        content: sqlText,
        explanation: explainMode === 'easy'
          ? '🤔 Không nhận diện được câu lệnh. Kiểm tra lại cú pháp!'
          : 'Unable to parse SQL statement. Please verify syntax.'
      });
    }

    return result;
  };

  const bgClass = isDark ? 'bg-slate-900' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-slate-800';
  const borderClass = isDark ? 'border-slate-700' : 'border-slate-200';
  const mutedClass = isDark ? 'text-slate-400' : 'text-slate-500';

  // Example queries
  const examples = [
    "SELECT * FROM students WHERE age > 18 ORDER BY name",
    "SELECT name, AVG(salary) FROM employees GROUP BY department",
    "SELECT * FROM orders JOIN products ON orders.product_id = products.id",
    "UPDATE students SET grade = 'A' WHERE id = 1",
    "DELETE FROM students WHERE age < 16"
  ];

  return (
    <div className={`rounded-2xl ${bgClass} shadow-xl overflow-hidden border ${borderClass}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🧠</span>
          <div>
            <h2 className="text-xl font-bold text-white">AI Giải thích SQL</h2>
            <p className="text-violet-100 text-sm">Dán câu SQL để xem giải thích từng phần</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Input */}
        <div className="mb-6">
          <label className={`block text-sm font-medium ${textClass} mb-2`}>
            Nhập câu lệnh SQL:
          </label>
          <textarea
            value={sql}
            onChange={(e) => setSQL(e.target.value)}
            placeholder="Ví dụ: SELECT * FROM students WHERE age > 18"
            className={`w-full h-32 p-4 rounded-xl font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 ${
              isDark ? 'bg-slate-800 text-green-400 border-slate-700' : 'bg-slate-50 text-slate-800 border-slate-200'
            } border`}
          />
          
          <button
            onClick={analyzeSQL}
            disabled={isAnalyzing || !sql.trim()}
            className="mt-3 w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <span className="animate-spin">⏳</span> Đang phân tích...
              </>
            ) : (
              <>
                <span>🔍</span> Phân tích SQL
              </>
            )}
          </button>
        </div>

        {/* Example queries */}
        <div className="mb-6">
          <h3 className={`text-sm font-medium ${mutedClass} mb-2`}>Thử với ví dụ:</h3>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex, i) => (
              <button
                key={i}
                onClick={() => setSQL(ex)}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {ex.length > 40 ? ex.slice(0, 40) + '...' : ex}
              </button>
            ))}
          </div>
        </div>

        {/* SQL Preview */}
        {sql && (
          <div className="mb-6">
            <h3 className={`text-sm font-medium ${textClass} mb-2`}>Câu lệnh:</h3>
            <SQLHighlighter sql={sql} mode={mode} />
          </div>
        )}

        {/* Analysis Result */}
        {parts.length > 0 && (
          <div className="space-y-4">
            <h3 className={`font-semibold ${textClass} flex items-center gap-2`}>
              <span>📝</span> Phân tích từng phần:
            </h3>
            
            {parts.map((part, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border-l-4 transition-all animate-fade-in ${
                  part.type === 'SELECT' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' :
                  part.type === 'FROM' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                  part.type === 'WHERE' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                  part.type === 'ORDER BY' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' :
                  part.type === 'GROUP BY' ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' :
                  part.type === 'JOIN' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' :
                  part.type === 'INSERT' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' :
                  part.type === 'UPDATE' ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' :
                  part.type === 'DELETE' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                  'border-slate-500 bg-slate-50 dark:bg-slate-800'
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    isDark ? 'bg-slate-700 text-slate-200' : 'bg-white text-slate-700'
                  }`}>
                    {part.type}
                  </span>
                  <div className="flex-1">
                    <code className={`block font-mono text-sm mb-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      {part.content}
                    </code>
                    <p className={`text-sm ${mutedClass}`}>
                      {part.explanation}
                    </p>
                  </div>
                </div>

                {/* Common errors for this type */}
                {sqlKeywordExplanations[part.type]?.errors && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <span className={`text-xs font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                      ⚠️ Lỗi thường gặp:
                    </span>
                    <ul className={`text-xs mt-1 space-y-0.5 ${mutedClass}`}>
                      {sqlKeywordExplanations[part.type].errors.slice(0, 2).map((err, j) => (
                        <li key={j}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
