import { useState, useEffect } from 'react';

interface TablePreviewProps {
  name: string;
  columns: string[];
  rows: (string | number)[][];
  highlightedRows?: number[];
  animateIn?: boolean;
}

export function TablePreview({ name, columns, rows, highlightedRows = [], animateIn = true }: TablePreviewProps) {
  const [visibleRows, setVisibleRows] = useState<number[]>([]);

  useEffect(() => {
    if (animateIn) {
      setVisibleRows([]);
      rows.forEach((_, index) => {
        setTimeout(() => {
          setVisibleRows(prev => [...prev, index]);
        }, index * 150);
      });
    } else {
      setVisibleRows(rows.map((_, i) => i));
    }
  }, [rows, animateIn]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
      {/* Table header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 flex items-center gap-2">
        <span className="text-xl">📋</span>
        <span className="text-white font-semibold">{name}</span>
      </div>
      
      {/* Table content */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100">
              {columns.map((col, index) => (
                <th 
                  key={index}
                  className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                className={`transition-all duration-300 ${
                  visibleRows.includes(rowIndex) 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 -translate-x-4'
                } ${
                  highlightedRows.includes(rowIndex)
                    ? 'bg-green-100'
                    : rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                }`}
              >
                {row.map((cell, cellIndex) => (
                  <td 
                    key={cellIndex}
                    className="px-4 py-3 text-sm text-slate-600 border-b border-slate-100"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {rows.length === 0 && (
        <div className="px-4 py-8 text-center text-slate-400">
          <span className="text-4xl">📭</span>
          <p className="mt-2">Không có dữ liệu</p>
        </div>
      )}
    </div>
  );
}
