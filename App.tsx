import { useState, useEffect } from 'react';
import { sqlCategories } from './data/sqlCategories';
import { CategorySection } from './components/CategorySection';
import { SQLPlayground } from './components/SQLPlayground';
import { Flashcards } from './components/Flashcards';
import { SQLExplainer } from './components/SQLExplainer';
import { AICommandLine } from './components/AICommandLine';
import { RobotGuide } from './components/RobotGuide';

type TabType = 'ddl' | 'dml' | 'dcl' | 'sandbox' | 'flashcards' | 'explainer' | 'terminal';
type ExplanationMode = 'easy' | 'technical';
type ThemeMode = 'light' | 'dark';

interface SavedProgress {
  completedCommands: string[];
  masteredCards: string[];
  currentTab: TabType;
  tutorialCompleted: boolean;
}

export function App() {
  // Theme & Mode
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [explanationMode, setExplanationMode] = useState<ExplanationMode>('easy');
  
  // Navigation
  const [activeTab, setActiveTab] = useState<TabType>('terminal');
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Progress
  const [completedCommands, setCompletedCommands] = useState<string[]>([]);
  const [masteredCards, setMasteredCards] = useState<string[]>([]);
  
  // Tutorial
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);

  const isDark = theme === 'dark';

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem('sqlMasterPro_progress');
    if (saved) {
      try {
        const data: SavedProgress = JSON.parse(saved);
        setCompletedCommands(data.completedCommands || []);
        setMasteredCards(data.masteredCards || []);
        if (data.currentTab) setActiveTab(data.currentTab);
        if (data.tutorialCompleted) {
          setTutorialCompleted(true);
          setShowTutorial(false);
        }
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  // Save progress
  useEffect(() => {
    const data: SavedProgress = {
      completedCommands,
      masteredCards,
      currentTab: activeTab,
      tutorialCompleted,
    };
    localStorage.setItem('sqlMasterPro_progress', JSON.stringify(data));
  }, [completedCommands, masteredCards, activeTab, tutorialCompleted]);

  const handleCompleteCommand = (commandId: string) => {
    if (!completedCommands.includes(commandId)) {
      setCompletedCommands(prev => [...prev, commandId]);
    }
  };

  const handleMasterCard = (cardId: string) => {
    if (!masteredCards.includes(cardId)) {
      setMasteredCards(prev => [...prev, cardId]);
    }
  };

  const handleSkipTutorial = () => {
    setShowTutorial(false);
    setTutorialCompleted(true);
  };

  const handleCompleteTutorial = () => {
    setShowTutorial(false);
    setTutorialCompleted(true);
  };

  // Calculate total progress
  const totalCommands = sqlCategories.reduce((acc, cat) => acc + cat.commands.length, 0);
  const progressPercent = (completedCommands.length / totalCommands) * 100;

  const tabs: { id: TabType; icon: string; label: string; color: string; badge?: number; isNew?: boolean }[] = [
    { 
      id: 'terminal', 
      icon: '💻', 
      label: 'AI Terminal', 
      color: 'from-gray-700 to-gray-900',
      isNew: true
    },
    { 
      id: 'ddl', 
      icon: '🏗️', 
      label: 'DDL - Khởi tạo', 
      color: 'from-blue-500 to-cyan-600',
      badge: sqlCategories[0].commands.length 
    },
    { 
      id: 'dml', 
      icon: '📝', 
      label: 'DML - CRUD', 
      color: 'from-green-500 to-emerald-600',
      badge: sqlCategories[1].commands.length 
    },
    { 
      id: 'dcl', 
      icon: '🔐', 
      label: 'DCL - Quyền', 
      color: 'from-purple-500 to-violet-600',
      badge: sqlCategories[2].commands.length 
    },
    { id: 'sandbox', icon: '🧪', label: 'Sandbox', color: 'from-amber-500 to-orange-600' },
    { id: 'flashcards', icon: '🎴', label: 'Flashcard', color: 'from-pink-500 to-rose-600' },
    { id: 'explainer', icon: '🧠', label: 'Giải thích', color: 'from-indigo-500 to-purple-600' },
  ];

  const bgClass = isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50';
  const textClass = isDark ? 'text-white' : 'text-slate-800';
  const borderClass = isDark ? 'border-slate-800' : 'border-slate-200';

  const currentCategory = sqlCategories.find(c => c.id === activeTab);

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
      {/* Robot Tutorial */}
      {showTutorial && (
        <RobotGuide 
          onSkip={handleSkipTutorial}
          onComplete={handleCompleteTutorial}
          isDark={isDark}
        />
      )}

      {/* Header */}
      <header className={`sticky top-0 z-50 ${isDark ? 'bg-slate-900/95' : 'bg-white/95'} backdrop-blur-lg shadow-lg border-b ${borderClass}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-xl">🐬</span>
              </div>
              <div className="hidden sm:block">
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'}`}>
                  SQL Master Pro
                </h1>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Tạo bởi <span className="font-semibold text-indigo-500">Đạt đờ rao</span> 🚀
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="hidden md:flex items-center gap-3">
              <div className={`px-3 py-1.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏆</span>
                  <div>
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tiến trình</div>
                    <div className={`text-sm font-bold ${textClass}`}>
                      {completedCommands.length}/{totalCommands}
                    </div>
                  </div>
                  <div className="w-16 h-2 bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Tutorial button */}
              <button
                onClick={() => setShowTutorial(true)}
                className={`p-2 rounded-xl transition-all ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Xem hướng dẫn"
              >
                🤖
              </button>

              {/* Explanation Mode Toggle */}
              <div className={`hidden sm:flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <button
                  onClick={() => setExplanationMode('easy')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    explanationMode === 'easy'
                      ? 'bg-green-500 text-white'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🟢 Dễ hiểu
                </button>
                <button
                  onClick={() => setExplanationMode('technical')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    explanationMode === 'technical'
                      ? 'bg-blue-500 text-white'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🔵 Kỹ thuật
                </button>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className={`p-2 rounded-xl transition-all ${
                  isDark ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isDark ? '☀️' : '🌙'}
              </button>

              {/* Mobile sidebar toggle */}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`lg:hidden p-2 rounded-xl ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
              >
                ☰
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          {showSidebar && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className={`sticky top-24 rounded-2xl shadow-xl overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border`}>
                {/* AI Terminal - Featured */}
                <div className="p-4">
                  <button
                    onClick={() => setActiveTab('terminal')}
                    className={`w-full p-4 rounded-xl text-left transition-all relative overflow-hidden ${
                      activeTab === 'terminal'
                        ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg ring-2 ring-green-500'
                        : isDark 
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💻</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold flex items-center gap-2">
                          AI Terminal
                          <span className="px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full animate-pulse">
                            NEW
                          </span>
                        </div>
                        <div className={`text-xs ${activeTab === 'terminal' ? 'text-white/70' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          MySQL CLI + AI
                        </div>
                      </div>
                    </div>
                    {/* Terminal animation */}
                    <div className={`mt-3 p-2 rounded-lg font-mono text-xs ${isDark ? 'bg-black/30' : 'bg-slate-900'} text-green-400`}>
                      <span className="animate-pulse">mysql&gt;</span> _
                    </div>
                  </button>
                </div>

                <div className={`border-t ${borderClass}`}></div>

                {/* Categories */}
                <div className="p-4 space-y-2">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-3`}>
                    Phân loại SQL
                  </h3>
                  
                  {tabs.slice(1, 4).map(tab => {
                    const category = sqlCategories.find(c => c.id === tab.id);
                    const completed = category 
                      ? completedCommands.filter(c => category.commands.some(cmd => cmd.id === c)).length
                      : 0;
                    const total = category?.commands.length || 0;
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full p-3 rounded-xl text-left transition-all ${
                          activeTab === tab.id
                            ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                            : isDark 
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{tab.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{tab.label}</div>
                            <div className={`text-xs ${activeTab === tab.id ? 'text-white/70' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {completed}/{total} lệnh
                            </div>
                          </div>
                          {completed === total && total > 0 && (
                            <span className="text-green-400">✓</span>
                          )}
                        </div>
                        {/* Mini progress */}
                        <div className={`mt-2 h-1 rounded-full overflow-hidden ${activeTab === tab.id ? 'bg-white/30' : isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                          <div 
                            className={`h-full rounded-full transition-all ${activeTab === tab.id ? 'bg-white' : 'bg-green-500'}`}
                            style={{ width: total > 0 ? `${(completed/total)*100}%` : '0%' }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Divider */}
                <div className={`border-t ${borderClass}`}></div>

                {/* Tools */}
                <div className="p-4 space-y-2">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-3`}>
                    Công cụ
                  </h3>
                  
                  {tabs.slice(4).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                        activeTab === tab.id
                          ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                          : isDark 
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="text-xl">{tab.icon}</span>
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Quick Stats */}
                <div className={`p-4 border-t ${borderClass} ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                      <div className="text-xl font-bold text-green-500">
                        {completedCommands.length}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Đã học
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                      <div className="text-xl font-bold text-amber-500">
                        {masteredCards.length}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Flashcard
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Mobile Tabs */}
            <div className="lg:hidden mb-4 overflow-x-auto pb-2">
              <div className="flex gap-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                        : isDark 
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-white text-slate-600 shadow'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label.split(' - ')[0]}</span>
                    {tab.isNew && (
                      <span className="px-1 py-0.5 bg-green-500 text-white text-xs rounded">NEW</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Terminal */}
            {activeTab === 'terminal' && (
              <AICommandLine isDark={isDark} mode={explanationMode} />
            )}

            {/* Category Content */}
            {currentCategory && (
              <CategorySection
                category={currentCategory}
                isDark={isDark}
                mode={explanationMode}
                completedCommands={completedCommands}
                onComplete={handleCompleteCommand}
              />
            )}

            {/* Sandbox */}
            {activeTab === 'sandbox' && (
              <SQLPlayground isDark={isDark} mode={explanationMode} />
            )}

            {/* Flashcards */}
            {activeTab === 'flashcards' && (
              <Flashcards
                isDark={isDark}
                masteredCards={masteredCards}
                onMaster={handleMasterCard}
              />
            )}

            {/* Explainer */}
            {activeTab === 'explainer' && (
              <SQLExplainer isDark={isDark} mode={explanationMode} />
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className={`mt-12 py-6 border-t ${borderClass} ${isDark ? 'bg-slate-900' : 'bg-white/50'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🐬</span>
              <div>
                <div className={`font-bold ${textClass}`}>SQL Master Pro</div>
                <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Tạo bởi <span className="font-semibold text-indigo-500">Đạt đờ rao</span> • DDL | DML | DCL
                </div>
              </div>
            </div>
            
            <div className={`flex items-center gap-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <div className="flex items-center gap-2">
                <span>🏗️</span>
                <span>{sqlCategories[0].commands.length} lệnh DDL</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📝</span>
                <span>{sqlCategories[1].commands.length} lệnh DML</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🔐</span>
                <span>{sqlCategories[2].commands.length} lệnh DCL</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Mode Selector */}
      <div className={`sm:hidden fixed bottom-4 left-4 right-4 p-3 rounded-2xl shadow-xl ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border flex items-center justify-center gap-2`}>
        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Chế độ:</span>
        <button
          onClick={() => setExplanationMode('easy')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            explanationMode === 'easy'
              ? 'bg-green-500 text-white'
              : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
          }`}
        >
          🟢 Dễ hiểu
        </button>
        <button
          onClick={() => setExplanationMode('technical')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            explanationMode === 'technical'
              ? 'bg-blue-500 text-white'
              : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
          }`}
        >
          🔵 Kỹ thuật
        </button>
      </div>
    </div>
  );
}
