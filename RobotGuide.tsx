import { useState, useEffect } from 'react';

interface RobotGuideProps {
  onSkip: () => void;
  onComplete: () => void;
  isDark: boolean;
}

interface TutorialStep {
  title: string;
  message: string;
  icon: string;
  tip?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Chào mừng bạn! 🎉',
    message: 'Mình là SQL Bot - trợ lý học SQL của bạn! Mình sẽ hướng dẫn bạn 3 bước đơn giản để bắt đầu.',
    icon: '🤖',
    tip: 'Bạn có thể bỏ qua hướng dẫn bất cứ lúc nào!'
  },
  {
    title: 'Bước 1: AI Terminal 💻',
    message: 'Đây là tính năng đặc biệt! Gõ lệnh SQL như MySQL thật, AI sẽ kiểm tra, sửa lỗi và giải thích cho bạn.',
    icon: '💻',
    tip: 'Gõ tiếng Việt, AI sẽ chuyển thành SQL cho bạn!'
  },
  {
    title: 'Bước 2: 3 Nhóm Lệnh 📚',
    message: 'DDL (tạo bảng) → DML (thêm/sửa/xóa) → DCL (phân quyền). Học theo thứ tự này là chuẩn nhất!',
    icon: '📚',
    tip: 'Mỗi lệnh đều có ví dụ chạy được ngay!'
  },
  {
    title: 'Bước 3: Thực hành! 🚀',
    message: 'Vào Sandbox để chạy SQL thật, Flashcard để học thuộc, và Mini Game để vui hơn!',
    icon: '🚀',
    tip: 'Tiến trình học được lưu tự động!'
  }
];

export function RobotGuide({ onSkip, onComplete, isDark }: RobotGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [robotMood, setRobotMood] = useState<'happy' | 'excited' | 'thinking'>('happy');

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  useEffect(() => {
    // Animate robot when step changes
    setIsAnimating(true);
    setRobotMood(currentStep === 0 ? 'happy' : currentStep === tutorialSteps.length - 1 ? 'excited' : 'thinking');
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const nextStep = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const bgClass = isDark ? 'bg-slate-900/98' : 'bg-white/98';
  const textClass = isDark ? 'text-white' : 'text-slate-800';
  const mutedClass = isDark ? 'text-slate-400' : 'text-slate-500';

  // Robot face expressions
  const getRobotFace = () => {
    switch (robotMood) {
      case 'excited':
        return { eyes: '★ ★', mouth: '▽' };
      case 'thinking':
        return { eyes: '◉ ◉', mouth: '～' };
      default:
        return { eyes: '◠ ◠', mouth: '◡' };
    }
  };

  const face = getRobotFace();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onSkip}
      />
      
      {/* Modal */}
      <div className={`relative ${bgClass} rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden`}>
        {/* Skip button */}
        <button
          onClick={onSkip}
          className={`absolute top-4 right-4 px-3 py-1 rounded-lg text-sm font-medium transition-colors z-10 ${
            isDark 
              ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' 
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          Bỏ qua →
        </button>

        {/* Robot Character */}
        <div className="pt-8 pb-4 flex justify-center">
          <div className={`relative transition-transform duration-500 ${isAnimating ? 'scale-110' : 'scale-100'}`}>
            {/* Robot Body */}
            <div className="relative">
              {/* Antenna */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
                <div className="w-1 h-4 bg-slate-400" />
              </div>
              
              {/* Head */}
              <div className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${
                robotMood === 'excited' ? 'from-yellow-400 to-orange-500' :
                robotMood === 'thinking' ? 'from-blue-400 to-indigo-500' :
                'from-cyan-400 to-blue-500'
              } shadow-xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300`}>
                {/* Shine effect */}
                <div className="absolute top-2 left-4 w-6 h-6 bg-white/40 rounded-full blur-sm" />
                
                {/* Screen/Face */}
                <div className="bg-slate-900/80 rounded-xl px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-cyan-400 tracking-widest">
                    {face.eyes}
                  </div>
                  <div className="text-xl font-bold text-cyan-400 mt-1">
                    {face.mouth}
                  </div>
                </div>

                {/* Ear lights */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-8 bg-green-400 rounded-r-full animate-pulse" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-8 bg-green-400 rounded-l-full animate-pulse" />
              </div>

              {/* Arms (animated) */}
              <div className={`absolute top-1/2 -left-4 w-4 h-12 bg-gradient-to-b from-slate-400 to-slate-500 rounded-full transition-transform duration-300 ${
                isAnimating ? 'rotate-12' : '-rotate-6'
              }`} />
              <div className={`absolute top-1/2 -right-4 w-4 h-12 bg-gradient-to-b from-slate-400 to-slate-500 rounded-full transition-transform duration-300 ${
                isAnimating ? '-rotate-12' : 'rotate-6'
              }`} />
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-4">
          {tutorialSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentStep 
                  ? 'bg-cyan-500 w-8' 
                  : index < currentStep
                    ? 'bg-green-500'
                    : isDark ? 'bg-slate-700' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          <div className={`text-center transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            {/* Icon */}
            <div className="text-5xl mb-3">{step.icon}</div>
            
            {/* Title */}
            <h2 className={`text-2xl font-bold ${textClass} mb-3`}>
              {step.title}
            </h2>
            
            {/* Message */}
            <p className={`text-lg ${mutedClass} mb-4 leading-relaxed`}>
              {step.message}
            </p>

            {/* Tip */}
            {step.tip && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${
                isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600'
              } text-sm`}>
                <span>💡</span>
                <span>{step.tip}</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  isDark 
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                ← Trước
              </button>
            )}
            
            <button
              onClick={nextStep}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all bg-gradient-to-r ${
                isLastStep 
                  ? 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                  : 'from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
              } text-white shadow-lg`}
            >
              {isLastStep ? '🚀 Bắt đầu học!' : 'Tiếp theo →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
