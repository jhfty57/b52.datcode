import { SQLLesson } from '../data/sqlLessons';

interface ProgressTrackerProps {
  lessons: SQLLesson[];
  learnedKeywords: string[];
  currentLessonId: number;
  onSelectLesson: (id: number) => void;
}

export function ProgressTracker({ lessons, learnedKeywords, currentLessonId, onSelectLesson }: ProgressTrackerProps) {
  const totalKeywords = lessons.flatMap(l => l.keywords).length;
  const progressPercent = (learnedKeywords.length / totalKeywords) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
      {/* Overall progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="text-xl">🏆</span>
            Tiến Trình Học
          </h3>
          <span className="text-sm font-semibold text-indigo-600">
            {learnedKeywords.length}/{totalKeywords} từ khóa
          </span>
        </div>
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      
      {/* Lesson list */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Các Bài Học
        </h4>
        {lessons.map((lesson) => {
          const lessonLearnedCount = lesson.keywords.filter(k => 
            learnedKeywords.includes(k.keyword)
          ).length;
          const lessonComplete = lessonLearnedCount === lesson.keywords.length;
          const isActive = lesson.id === currentLessonId;
          
          return (
            <button
              key={lesson.id}
              onClick={() => onSelectLesson(lesson.id)}
              className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                isActive 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                  : lessonComplete
                    ? 'bg-green-50 hover:bg-green-100 border border-green-200'
                    : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span className="text-2xl">{lesson.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold truncate ${isActive ? 'text-white' : 'text-slate-700'}`}>
                  {lesson.title}
                </div>
                <div className={`text-xs ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                  {lessonLearnedCount}/{lesson.keywords.length} từ khóa
                </div>
              </div>
              {lessonComplete && !isActive && (
                <span className="text-xl">✅</span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Keywords to memorize */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <span>📚</span>
          Từ Khóa Cần Thuộc
        </h4>
        <div className="flex flex-wrap gap-2">
          {lessons
            .find(l => l.id === currentLessonId)
            ?.keywords.map(keyword => (
              <span
                key={keyword.keyword}
                className={`px-3 py-1.5 rounded-full text-sm font-mono transition-all ${
                  learnedKeywords.includes(keyword.keyword)
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-300'
                }`}
              >
                {learnedKeywords.includes(keyword.keyword) && '✓ '}
                {keyword.keyword}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
