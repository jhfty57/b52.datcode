import { useState, useRef, useEffect, useCallback } from 'react';
import { useSQLEngine } from '../hooks/useSQLEngine';

interface AICommandLineProps {
  isDark: boolean;
  mode: 'easy' | 'technical';
}

interface CommandEntry {
  id: number;
  type: 'input' | 'continuation' | 'result' | 'error' | 'warning' | 'info' | 'ai';
  content: string;
  table?: { columns: string[]; rows: (string | number | null)[][] };
  timestamp: Date;
}

interface DangerousCommand {
  pattern: RegExp;
  warning: string;
  level: 'high' | 'medium';
}

const dangerousCommands: DangerousCommand[] = [
  { pattern: /^DROP\s+TABLE\s+/i, warning: '⚠️ NGUY HIỂM: Lệnh này sẽ XÓA VĨNH VIỄN bảng và tất cả dữ liệu!', level: 'high' },
  { pattern: /^DROP\s+DATABASE\s+/i, warning: '🚨 CỰC KỲ NGUY HIỂM: Lệnh này sẽ XÓA TOÀN BỘ DATABASE!', level: 'high' },
  { pattern: /^DELETE\s+FROM\s+\w+\s*;?\s*$/i, warning: '⚠️ CẢNH BÁO: DELETE không có WHERE sẽ xóa TẤT CẢ dữ liệu!', level: 'high' },
  { pattern: /^TRUNCATE\s+/i, warning: '⚠️ CẢNH BÁO: TRUNCATE sẽ xóa toàn bộ dữ liệu trong bảng!', level: 'high' },
  { pattern: /^UPDATE\s+\w+\s+SET\s+[^W]*$/i, warning: '⚠️ CẢNH BÁO: UPDATE không có WHERE sẽ cập nhật TẤT CẢ hàng!', level: 'medium' },
];

// Vietnamese to SQL mappings
const vietnameseToSQL: { pattern: RegExp; template: string }[] = [
  { pattern: /lấy\s+tất\s+cả\s+(?:từ\s+)?(?:bảng\s+)?(\w+)/i, template: 'SELECT * FROM $1' },
  { pattern: /đếm\s+(?:số\s+)?(?:lượng\s+)?(?:trong\s+)?(?:bảng\s+)?(\w+)/i, template: 'SELECT COUNT(*) FROM $1' },
  { pattern: /xem\s+(?:bảng\s+)?(\w+)/i, template: 'SELECT * FROM $1' },
  { pattern: /hiển\s+thị\s+(?:tất\s+cả\s+)?(?:bảng\s+)?(\w+)/i, template: 'SELECT * FROM $1' },
  { pattern: /tìm\s+(.+)\s+trong\s+(\w+)\s+(?:với|có|where)\s+(.+)/i, template: 'SELECT $1 FROM $2 WHERE $3' },
  { pattern: /sắp\s+xếp\s+(\w+)\s+theo\s+(\w+)\s+(?:tăng|tăng\s+dần)/i, template: 'SELECT * FROM $1 ORDER BY $2 ASC' },
  { pattern: /sắp\s+xếp\s+(\w+)\s+theo\s+(\w+)\s+(?:giảm|giảm\s+dần)/i, template: 'SELECT * FROM $1 ORDER BY $2 DESC' },
  { pattern: /thêm\s+(.+)\s+vào\s+(\w+)/i, template: 'INSERT INTO $2 VALUES ($1)' },
  { pattern: /xóa\s+(?:từ\s+)?(\w+)\s+(?:với|có|where)\s+(.+)/i, template: 'DELETE FROM $1 WHERE $2' },
];

// SQL syntax corrections
const sqlCorrections: { pattern: RegExp; fix: string; message: string }[] = [
  { pattern: /SLECT/gi, fix: 'SELECT', message: 'Sửa lỗi: SLECT → SELECT' },
  { pattern: /FORM/gi, fix: 'FROM', message: 'Sửa lỗi: FORM → FROM' },
  { pattern: /WHER(?!E)/gi, fix: 'WHERE', message: 'Sửa lỗi: WHER → WHERE' },
  { pattern: /ODER\s+BY/gi, fix: 'ORDER BY', message: 'Sửa lỗi: ODER BY → ORDER BY' },
  { pattern: /GRUOP\s+BY/gi, fix: 'GROUP BY', message: 'Sửa lỗi: GRUOP BY → GROUP BY' },
  { pattern: /DELTE/gi, fix: 'DELETE', message: 'Sửa lỗi: DELTE → DELETE' },
  { pattern: /UDPATE/gi, fix: 'UPDATE', message: 'Sửa lỗi: UDPATE → UPDATE' },
  { pattern: /INSET/gi, fix: 'INSERT', message: 'Sửa lỗi: INSET → INSERT' },
  { pattern: /VALEUS/gi, fix: 'VALUES', message: 'Sửa lỗi: VALEUS → VALUES' },
  { pattern: /JION/gi, fix: 'JOIN', message: 'Sửa lỗi: JION → JOIN' },
];

export function AICommandLine({ isDark, mode }: AICommandLineProps) {
  // Buffer for multi-line input (giống MySQL CLI)
  const [buffer, setBuffer] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState('');
  const [history, setHistory] = useState<CommandEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [learningMode, setLearningMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingDangerousCommand, setPendingDangerousCommand] = useState<string | null>(null);
  const [isMultiLine, setIsMultiLine] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);
  
  const { executeSQL, resetDB, isReady } = useSQLEngine();

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history, buffer]);

  // Welcome message
  useEffect(() => {
    if (isReady && history.length === 0) {
      addEntry('info', `
╔══════════════════════════════════════════════════════════════════╗
║       🐬 MySQL 8.0 Command Line Client - AI Enhanced            ║
║       Tạo bởi Đạt đờ rao                                         ║
╠══════════════════════════════════════════════════════════════════╣
║  💡 Nhập SQL như MySQL CLI thật:                                 ║
║     • Enter = xuống dòng (tiếp tục nhập)                         ║
║     • Kết thúc bằng ; = thực thi lệnh                            ║
║     • Ctrl+Enter = thực thi ngay                                 ║
║                                                                  ║
║  📚 Gõ "help" để xem hướng dẫn                                   ║
╚══════════════════════════════════════════════════════════════════╝
      `);
    }
  }, [isReady]);

  const addEntry = useCallback((type: CommandEntry['type'], content: string, options?: Partial<CommandEntry>) => {
    const entry: CommandEntry = {
      id: idCounter.current++,
      type,
      content,
      timestamp: new Date(),
      ...options,
    };
    setHistory(prev => [...prev, entry]);
  }, []);

  // Check if command is complete (ends with ;)
  const isCommandComplete = (text: string): boolean => {
    const trimmed = text.trim();
    // Special commands don't need ;
    const specialCommands = ['help', 'clear', 'reset', 'tables', 'yes', 'no', 'y', 'n', 'ai on', 'ai off', 'learn on', 'learn off'];
    const lowerTrimmed = trimmed.toLowerCase();
    
    if (specialCommands.some(cmd => lowerTrimmed === cmd)) return true;
    if (lowerTrimmed.startsWith('desc ') || lowerTrimmed.startsWith('describe ')) return true;
    
    // Vietnamese commands (don't need ;)
    for (const mapping of vietnameseToSQL) {
      if (mapping.pattern.test(trimmed)) return true;
    }
    
    // SQL commands need ;
    return trimmed.endsWith(';');
  };

  // Convert Vietnamese to SQL
  const convertVietnameseToSQL = (text: string): string | null => {
    for (const mapping of vietnameseToSQL) {
      const match = text.match(mapping.pattern);
      if (match) {
        let sql = mapping.template;
        for (let i = 1; i < match.length; i++) {
          sql = sql.replace(`$${i}`, match[i]);
        }
        return sql + ';';
      }
    }
    return null;
  };

  // Fix SQL typos
  const fixSQLTypos = (sql: string): { fixed: string; corrections: string[] } => {
    let fixed = sql;
    const corrections: string[] = [];
    
    for (const correction of sqlCorrections) {
      if (correction.pattern.test(fixed)) {
        fixed = fixed.replace(correction.pattern, correction.fix);
        corrections.push(correction.message);
      }
    }
    
    return { fixed, corrections };
  };

  // Check for dangerous commands
  const checkDangerousCommand = (sql: string): DangerousCommand | null => {
    for (const dangerous of dangerousCommands) {
      if (dangerous.pattern.test(sql.trim())) {
        return dangerous;
      }
    }
    return null;
  };

  // Explain SQL parts
  const explainSQL = (sql: string): string => {
    const parts: string[] = [];
    const upperSQL = sql.toUpperCase();
    
    if (upperSQL.includes('SELECT')) {
      const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
      if (selectMatch) {
        const columns = selectMatch[1].trim();
        parts.push(mode === 'easy' 
          ? `📋 Lấy ${columns === '*' ? 'tất cả cột' : `cột: ${columns}`}`
          : `SELECT: Retrieves ${columns === '*' ? 'all columns' : `columns: ${columns}`}`);
      }
    }

    if (upperSQL.includes('FROM')) {
      const fromMatch = sql.match(/FROM\s+(\w+)/i);
      if (fromMatch) {
        parts.push(mode === 'easy'
          ? `📁 Từ bảng: ${fromMatch[1]}`
          : `FROM: Source table "${fromMatch[1]}"`);
      }
    }

    if (upperSQL.includes('WHERE')) {
      const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+GROUP|\s+LIMIT|;|$)/i);
      if (whereMatch) {
        parts.push(mode === 'easy'
          ? `🔍 Điều kiện: ${whereMatch[1].trim()}`
          : `WHERE: Filter condition "${whereMatch[1].trim()}"`);
      }
    }

    if (upperSQL.includes('ORDER BY')) {
      const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)\s*(ASC|DESC)?/i);
      if (orderMatch) {
        const direction = orderMatch[2]?.toUpperCase() === 'DESC' ? 'giảm dần' : 'tăng dần';
        parts.push(mode === 'easy'
          ? `📊 Sắp xếp: ${orderMatch[1]} (${direction})`
          : `ORDER BY: Sort by "${orderMatch[1]}" ${orderMatch[2] || 'ASC'}`);
      }
    }

    if (upperSQL.includes('GROUP BY')) {
      const groupMatch = sql.match(/GROUP\s+BY\s+(\w+)/i);
      if (groupMatch) {
        parts.push(mode === 'easy'
          ? `📦 Nhóm theo: ${groupMatch[1]}`
          : `GROUP BY: Group rows by "${groupMatch[1]}"`);
      }
    }

    if (upperSQL.includes('JOIN')) {
      parts.push(mode === 'easy'
        ? '🔗 Kết nối các bảng với nhau'
        : 'JOIN: Combines rows from multiple tables');
    }

    if (upperSQL.includes('INSERT')) {
      const insertMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i);
      if (insertMatch) {
        parts.push(mode === 'easy'
          ? `➕ Thêm dữ liệu vào bảng: ${insertMatch[1]}`
          : `INSERT: Add new row(s) to "${insertMatch[1]}"`);
      }
    }

    if (upperSQL.includes('UPDATE')) {
      const updateMatch = sql.match(/UPDATE\s+(\w+)/i);
      if (updateMatch) {
        parts.push(mode === 'easy'
          ? `✏️ Cập nhật bảng: ${updateMatch[1]}`
          : `UPDATE: Modify rows in "${updateMatch[1]}"`);
      }
    }

    if (upperSQL.includes('DELETE')) {
      const deleteMatch = sql.match(/DELETE\s+FROM\s+(\w+)/i);
      if (deleteMatch) {
        parts.push(mode === 'easy'
          ? `🗑️ Xóa từ bảng: ${deleteMatch[1]}`
          : `DELETE: Remove rows from "${deleteMatch[1]}"`);
      }
    }

    if (upperSQL.includes('CREATE TABLE')) {
      const createMatch = sql.match(/CREATE\s+TABLE\s+(\w+)/i);
      if (createMatch) {
        parts.push(mode === 'easy'
          ? `🏗️ Tạo bảng mới: ${createMatch[1]}`
          : `CREATE TABLE: Creates new table "${createMatch[1]}"`);
      }
    }

    if (upperSQL.includes('ALTER TABLE')) {
      const alterMatch = sql.match(/ALTER\s+TABLE\s+(\w+)/i);
      if (alterMatch) {
        parts.push(mode === 'easy'
          ? `🔧 Thay đổi cấu trúc bảng: ${alterMatch[1]}`
          : `ALTER TABLE: Modifies table structure "${alterMatch[1]}"`);
      }
    }

    return parts.join('\n');
  };

  // Get optimization suggestions
  const getOptimizationTips = (sql: string): string[] => {
    const tips: string[] = [];
    const upperSQL = sql.toUpperCase();

    if (upperSQL.includes('SELECT *')) {
      tips.push('💡 Nên chỉ định cột cụ thể thay vì SELECT * để tăng hiệu suất');
    }

    if (upperSQL.includes('SELECT') && !upperSQL.includes('LIMIT') && !upperSQL.includes('COUNT')) {
      tips.push('💡 Thêm LIMIT để giới hạn kết quả khi test');
    }

    if (upperSQL.includes('LIKE') && sql.includes("'%")) {
      tips.push('💡 LIKE bắt đầu bằng % sẽ không sử dụng INDEX');
    }

    if (upperSQL.includes('OR') && upperSQL.includes('WHERE')) {
      tips.push('💡 OR có thể chậm, xem xét dùng UNION hoặc IN thay thế');
    }

    return tips;
  };

  const getErrorHelp = (error: string): string | null => {
    if (error.includes('không tồn tại') || error.includes('not found') || error.includes('no such table')) {
      return `💡 Gợi ý: Kiểm tra lại tên bảng/cột. Gõ "tables" để xem danh sách bảng.`;
    }
    if (error.includes('cú pháp') || error.includes('Syntax') || error.includes('syntax')) {
      return `💡 Gợi ý: Kiểm tra lại cú pháp SQL. Ví dụ: SELECT column FROM table WHERE condition;`;
    }
    return null;
  };

  // Execute the final command
  const executeCommand = useCallback((fullSQL: string) => {
    // Add to command history
    setCommandHistory(prev => {
      const newHistory = [fullSQL, ...prev.filter(c => c !== fullSQL)].slice(0, 50);
      return newHistory;
    });
    setHistoryIndex(-1);

    const trimmedSQL = fullSQL.trim();
    const lowerSQL = trimmedSQL.toLowerCase();

    // Handle special commands
    if (lowerSQL === 'help') {
      addEntry('info', `
📚 HƯỚNG DẪN SỬ DỤNG (GIỐNG MYSQL CLI):
═══════════════════════════════════════════════════════════
  
⌨️  CÁCH NHẬP LỆNH:
────────────────────────────────────────────────────────────
  • Enter        = Xuống dòng (tiếp tục nhập)
  • Kết thúc ;   = Thực thi lệnh tự động  
  • Ctrl+Enter   = Thực thi ngay (không cần ;)
  • ↑ / ↓        = Duyệt lịch sử lệnh
  • Ctrl+L       = Xóa màn hình
  • Ctrl+C       = Hủy lệnh đang nhập

📋 LỆNH HỆ THỐNG:
────────────────────────────────────────────────────────────
  help          - Hiển thị hướng dẫn này
  clear         - Xóa màn hình terminal
  reset         - Khôi phục database về ban đầu
  tables        - Xem danh sách các bảng
  desc <table>  - Xem cấu trúc bảng
  ai on/off     - Bật/tắt AI hỗ trợ
  learn on/off  - Bật/tắt chế độ học tập

🗣️  GÕ TIẾNG VIỆT (AI tự chuyển sang SQL):
────────────────────────────────────────────────────────────
  "lấy tất cả từ students"
  "đếm số lượng trong products"  
  "sắp xếp employees theo salary giảm dần"

📝 VÍ DỤ SQL NHIỀU DÒNG:
────────────────────────────────────────────────────────────
  mysql> CREATE TABLE users (
      ->   id INT PRIMARY KEY,
      ->   name VARCHAR(100)
      -> );
      `);
      return;
    }

    if (lowerSQL === 'clear') {
      setHistory([]);
      return;
    }

    if (lowerSQL === 'reset') {
      resetDB();
      addEntry('info', '✅ Database đã được khôi phục về trạng thái ban đầu!');
      return;
    }

    if (lowerSQL === 'tables') {
      addEntry('info', `
📊 DANH SÁCH BẢNG:
────────────────────────────────────────
  • students   (id, name, age, grade, class)
  • products   (id, name, price, category, stock)
  • orders     (id, customer_name, product_id, quantity, order_date)
  • employees  (id, name, department, salary, hire_date)
      `);
      return;
    }

    if (lowerSQL.startsWith('desc ') || lowerSQL.startsWith('describe ')) {
      const tableName = trimmedSQL.split(/\s+/)[1]?.replace(';', '');
      const tableInfo: Record<string, string[]> = {
        students: ['id INT PRIMARY KEY', 'name VARCHAR(100)', 'age INT', 'grade VARCHAR(10)', 'class VARCHAR(20)'],
        products: ['id INT PRIMARY KEY', 'name VARCHAR(100)', 'price INT', 'category VARCHAR(50)', 'stock INT'],
        orders: ['id INT PRIMARY KEY', 'customer_name VARCHAR(100)', 'product_id INT', 'quantity INT', 'order_date DATE'],
        employees: ['id INT PRIMARY KEY', 'name VARCHAR(100)', 'department VARCHAR(50)', 'salary INT', 'hire_date DATE'],
      };
      
      if (tableName && tableInfo[tableName.toLowerCase()]) {
        addEntry('info', `
📋 Cấu trúc bảng: ${tableName}
────────────────────────────────────────
${tableInfo[tableName.toLowerCase()].map(col => `  ${col}`).join('\n')}
        `);
      } else {
        addEntry('error', `❌ Bảng "${tableName}" không tồn tại!`);
      }
      return;
    }

    if (lowerSQL === 'ai on') {
      setAiEnabled(true);
      addEntry('info', '🤖 AI hỗ trợ đã được BẬT');
      return;
    }

    if (lowerSQL === 'ai off') {
      setAiEnabled(false);
      addEntry('info', '🤖 AI hỗ trợ đã được TẮT');
      return;
    }

    if (lowerSQL === 'learn on') {
      setLearningMode(true);
      addEntry('info', '📚 Chế độ học tập đã được BẬT - Sẽ hiển thị gợi ý tối ưu');
      return;
    }

    if (lowerSQL === 'learn off') {
      setLearningMode(false);
      addEntry('info', '📚 Chế độ học tập đã được TẮT');
      return;
    }

    // Handle pending dangerous command confirmation
    if (pendingDangerousCommand) {
      if (lowerSQL === 'yes' || lowerSQL === 'y') {
        const cmd = pendingDangerousCommand;
        setPendingDangerousCommand(null);
        runSQL(cmd);
        return;
      } else if (lowerSQL === 'no' || lowerSQL === 'n') {
        setPendingDangerousCommand(null);
        addEntry('info', '❌ Đã hủy lệnh.');
        return;
      }
    }

    // Process SQL command
    let sqlToExecute = trimmedSQL;

    // AI Processing
    if (aiEnabled) {
      // Try to convert Vietnamese to SQL
      const convertedSQL = convertVietnameseToSQL(trimmedSQL);
      if (convertedSQL) {
        sqlToExecute = convertedSQL;
        addEntry('ai', `🔄 Chuyển đổi tiếng Việt → SQL:\n   ${convertedSQL}`);
      }

      // Fix typos
      const { fixed, corrections } = fixSQLTypos(sqlToExecute);
      if (corrections.length > 0) {
        sqlToExecute = fixed;
        addEntry('ai', `✏️ Sửa lỗi:\n${corrections.map(c => `   • ${c}`).join('\n')}\n   → ${fixed}`);
      }

      // Check dangerous commands
      const dangerous = checkDangerousCommand(sqlToExecute);
      if (dangerous) {
        addEntry('warning', dangerous.warning);
        if (dangerous.level === 'high') {
          setPendingDangerousCommand(sqlToExecute);
          addEntry('warning', '⚡ Gõ "yes" để xác nhận thực thi hoặc "no" để hủy');
          return;
        }
      }
    }

    runSQL(sqlToExecute);
  }, [aiEnabled, addEntry, resetDB, mode, learningMode, pendingDangerousCommand]);

  const runSQL = (sql: string) => {
    const result = executeSQL(sql);

    if (result.error) {
      addEntry('error', `ERROR: ${result.error}`);
      
      // AI error explanation
      if (aiEnabled) {
        const errorHelp = getErrorHelp(result.error);
        if (errorHelp) {
          addEntry('ai', errorHelp);
        }
      }
    } else {
      // Show explanation
      if (aiEnabled) {
        const explanation = explainSQL(sql);
        if (explanation) {
          addEntry('ai', `📝 Giải thích:\n${explanation}`);
        }
      }

      // Show result
      if (result.columns.length > 0 && result.rows.length > 0) {
        addEntry('result', `${result.rows.length} row(s) in set (${result.executionTime}ms)`, {
          table: { columns: result.columns, rows: result.rows },
        });
      } else {
        addEntry('info', `Query OK, ${result.affectedRows || 0} row(s) affected (${result.executionTime}ms)`);
      }

      // Learning mode: show optimization tips
      if (learningMode && aiEnabled) {
        const tips = getOptimizationTips(sql);
        if (tips.length > 0) {
          addEntry('ai', `📚 Gợi ý tối ưu:\n${tips.join('\n')}`);
        }
      }
    }
  };

  // Handle key press in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+L = clear screen
    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
      return;
    }

    // Ctrl+C = cancel current input
    if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      if (buffer.length > 0 || currentLine) {
        // Show cancelled input in history
        const cancelledLines = [...buffer, currentLine].filter(l => l);
        if (cancelledLines.length > 0) {
          cancelledLines.forEach((line, idx) => {
            addEntry(idx === 0 ? 'input' : 'continuation', line);
          });
        }
        addEntry('info', '^C');
      }
      setBuffer([]);
      setCurrentLine('');
      setIsMultiLine(false);
      return;
    }

    // Ctrl+Enter = execute immediately
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      const fullCommand = [...buffer, currentLine].join('\n').trim();
      if (fullCommand) {
        // Display all lines in history
        const allLines = [...buffer, currentLine];
        allLines.forEach((line, idx) => {
          if (line || idx === 0) {
            addEntry(idx === 0 ? 'input' : 'continuation', line);
          }
        });
        
        // Execute
        executeCommand(fullCommand);
        setBuffer([]);
        setCurrentLine('');
        setIsMultiLine(false);
      }
      return;
    }

    // Arrow Up = previous command in history (only when buffer is empty)
    if (e.key === 'ArrowUp' && buffer.length === 0 && currentLine === '') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentLine(commandHistory[newIndex]);
      }
      return;
    }

    // Arrow Down = next command in history
    if (e.key === 'ArrowDown' && buffer.length === 0) {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentLine(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentLine('');
      }
      return;
    }

    // Enter = new line OR execute if ends with ;
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      
      const fullCommand = [...buffer, currentLine].join('\n');
      
      // Check if command is complete
      if (isCommandComplete(fullCommand)) {
        // Display all lines in history
        const allLines = [...buffer, currentLine];
        allLines.forEach((line, idx) => {
          if (line || idx === 0) {
            addEntry(idx === 0 ? 'input' : 'continuation', line);
          }
        });
        
        // Execute the command
        executeCommand(fullCommand.trim());
        setBuffer([]);
        setCurrentLine('');
        setIsMultiLine(false);
      } else {
        // Command not complete, continue on new line
        setBuffer(prev => [...prev, currentLine]);
        setCurrentLine('');
        setIsMultiLine(true);
      }
      return;
    }
  };

  // Render table (giống MySQL CLI)
  const renderTable = (table: { columns: string[]; rows: (string | number | null)[][] }) => {
    const colWidths = table.columns.map((col, i) => {
      const maxDataWidth = Math.max(...table.rows.map(row => String(row[i] ?? 'NULL').length));
      return Math.max(col.length, maxDataWidth, 4);
    });

    const separator = '+' + colWidths.map(w => '-'.repeat(w + 2)).join('+') + '+';
    const header = '|' + table.columns.map((col, i) => ` ${col.padEnd(colWidths[i])} `).join('|') + '|';

    return (
      <div className="font-mono text-xs sm:text-sm overflow-x-auto whitespace-pre">
        <div className="text-cyan-400">{separator}</div>
        <div className="text-yellow-400 font-bold">{header}</div>
        <div className="text-cyan-400">{separator}</div>
        {table.rows.slice(0, 25).map((row, rowIndex) => (
          <div key={rowIndex} className="text-green-300">
            |{row.map((cell, i) => ` ${String(cell ?? 'NULL').padEnd(colWidths[i])} `).join('|')}|
          </div>
        ))}
        <div className="text-cyan-400">{separator}</div>
        {table.rows.length > 25 && (
          <div className="text-gray-500">... và {table.rows.length - 25} hàng nữa</div>
        )}
      </div>
    );
  };

  // Get prompt string
  const getPrompt = (isFirstLine: boolean) => {
    return isFirstLine ? 'mysql> ' : '    -> ';
  };

  return (
    <div className={`rounded-2xl overflow-hidden shadow-2xl ${isDark ? 'bg-gray-900' : 'bg-gray-800'} border border-gray-700`}>
      {/* Terminal Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
          </div>
          <span className="text-gray-300 text-sm font-mono font-medium">
            🐬 MySQL 8.0 Command Line Client — AI Enhanced
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Toggle */}
          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              aiEnabled 
                ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-600/30' 
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            🤖 AI {aiEnabled ? 'ON' : 'OFF'}
          </button>

          {/* Learning Mode Toggle */}
          <button
            onClick={() => setLearningMode(!learningMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              learningMode 
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/30' 
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            📚 Learn
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600 transition-colors"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-800/80 backdrop-blur px-4 py-3 border-b border-gray-700">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Chế độ:</span>
              <span className={`px-2 py-0.5 rounded font-medium ${mode === 'easy' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                {mode === 'easy' ? '🟢 Dễ hiểu' : '🔵 Kỹ thuật'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-400 text-xs">
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Enter</kbd> Xuống dòng</span>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-gray-700 rounded">;</kbd> Thực thi</span>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Ctrl+Enter</kbd> Chạy ngay</span>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-gray-700 rounded">↑↓</kbd> Lịch sử</span>
            </div>
          </div>
        </div>
      )}

      {/* Hint bar when typing multi-line */}
      {isMultiLine && (
        <div className="bg-yellow-900/30 border-b border-yellow-700/50 px-4 py-2 flex items-center gap-2">
          <span className="text-yellow-400 text-xs animate-pulse">⏳</span>
          <span className="text-yellow-300 text-xs">
            Lệnh chưa kết thúc, tiếp tục nhập... (kết thúc bằng <kbd className="px-1 py-0.5 bg-yellow-800 rounded text-yellow-200">;</kbd> hoặc <kbd className="px-1 py-0.5 bg-yellow-800 rounded text-yellow-200">Ctrl+Enter</kbd>)
          </span>
        </div>
      )}

      {/* Terminal Body */}
      <div 
        ref={terminalRef}
        className="p-4 h-[500px] overflow-y-auto font-mono text-sm bg-black cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {/* History */}
        {history.map(entry => (
          <div key={entry.id} className="mb-1">
            {entry.type === 'input' && (
              <div className="flex">
                <span className="text-green-500 select-none">mysql&gt; </span>
                <span className="text-white">{entry.content}</span>
              </div>
            )}
            
            {entry.type === 'continuation' && (
              <div className="flex">
                <span className="text-green-500 select-none">    -&gt; </span>
                <span className="text-white">{entry.content}</span>
              </div>
            )}
            
            {entry.type === 'result' && (
              <div className="my-2">
                {entry.table && renderTable(entry.table)}
                <div className="text-green-400 mt-1">{entry.content}</div>
              </div>
            )}
            
            {entry.type === 'error' && (
              <div className="text-red-400 py-1">{entry.content}</div>
            )}
            
            {entry.type === 'warning' && (
              <div className="text-yellow-400 bg-yellow-900/20 px-3 py-2 rounded my-1 border-l-2 border-yellow-500">
                {entry.content}
              </div>
            )}
            
            {entry.type === 'info' && (
              <div className="text-cyan-400 whitespace-pre-wrap py-1">{entry.content}</div>
            )}
            
            {entry.type === 'ai' && (
              <div className="text-purple-300 bg-purple-900/20 px-3 py-2 rounded my-1 border-l-2 border-purple-500 whitespace-pre-wrap">
                {entry.content}
              </div>
            )}
          </div>
        ))}

        {/* Buffer lines (multi-line input in progress) */}
        {buffer.map((line, idx) => (
          <div key={`buffer-${idx}`} className="flex">
            <span className="text-green-500 select-none">{getPrompt(idx === 0)}</span>
            <span className="text-white">{line}</span>
          </div>
        ))}

        {/* Current Input Line */}
        <div className="flex items-start">
          <span className="text-green-500 select-none shrink-0">
            {getPrompt(buffer.length === 0)}
          </span>
          <textarea
            ref={inputRef}
            value={currentLine}
            onChange={(e) => setCurrentLine(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white outline-none resize-none overflow-hidden caret-green-500"
            style={{ 
              height: '1.5em',
              lineHeight: '1.5em',
            }}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            rows={1}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-gray-500 text-xs shrink-0">Thử nhanh:</span>
          {[
            'SELECT * FROM students;',
            'lấy tất cả từ products',
            'SELECT name, age\nFROM students\nWHERE age > 20;',
          ].map((example, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentLine(example.includes('\n') ? example.split('\n')[0] : example);
                if (example.includes('\n')) {
                  const lines = example.split('\n');
                  setBuffer([]);
                  setCurrentLine(lines.join('\n'));
                }
                inputRef.current?.focus();
              }}
              className="px-3 py-1.5 text-xs rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors whitespace-nowrap shrink-0"
              title={example}
            >
              {example.length > 30 ? example.substring(0, 30) + '...' : example.replace(/\n/g, ' ')}
            </button>
          ))}
        </div>
        
        {/* Tips */}
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <span>💡 Nhập như MySQL CLI thật: <span className="text-green-400">Enter</span> = xuống dòng, <span className="text-green-400">;</span> = chạy</span>
        </div>
      </div>
    </div>
  );
}
