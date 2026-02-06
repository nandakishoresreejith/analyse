import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, StepForward, StepBack, RefreshCw, Code2, Zap, LayoutTemplate } from 'lucide-react';
import CodeEditor from './components/CodeEditor';
import Visualizer from './components/Visualizer';
import ChatWidget from './components/ChatWidget';
import { DEFAULT_INSERTION_SORT, executeUserCode } from './utils/executor';
import { analyzeCode, generateAlgorithmCode } from './services/geminiService';
import { VisualizationStep } from './types';

function App() {
  // State: Code & Data
  const [code, setCode] = useState(DEFAULT_INSERTION_SORT);
  const [data, setData] = useState<number[]>([50, 20, 90, 10, 30, 70, 40, 80, 60]);
  
  // State: Execution
  const [steps, setSteps] = useState<VisualizationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(500); // ms
  const [error, setError] = useState<string | null>(null);
  
  // State: AI
  const [analysis, setAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Refs
  const timerRef = useRef<number | null>(null);

  // Initial Run
  useEffect(() => {
    handleRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Execution Logic
  const handleRun = useCallback(() => {
    setIsPlaying(false);
    setError(null);
    setCurrentStepIndex(0);
    
    // Randomize data slightly for variety on reset if needed, but keeping static for consistency for now
    // Or just use current 'data' state.
    
    const result = executeUserCode(code, data);
    
    if (result.error) {
      setError(result.error);
      setSteps([]);
    } else {
      setSteps(result.steps);
      if (result.steps.length === 0) {
        setError("Code executed but no 'snapshot()' calls were made.");
      }
    }
  }, [code, data]);

  const handleReset = () => {
    // Generate new random data
    const newData = Array.from({ length: 10 }, () => Math.floor(Math.random() * 90) + 10);
    setData(newData);
    // We need to re-run execution with new data, but we can't do it immediately 
    // because setData is async. We'll use a side effect or just wait for user to hit run.
    // Better UX: Trigger run in useEffect when data changes? 
    // For now, let's just let the user hit Run or trigger it manually.
    setTimeout(() => {
        // Force re-run with new data logic
        // This is a bit hacky due to closure capture, let's just clear steps
        setSteps([]);
        setCurrentStepIndex(0);
    }, 0);
  };
  
  // Trigger Run when data changes explicitly via reset
  useEffect(() => {
      if (steps.length === 0 && !error) {
          handleRun();
      }
  }, [data, handleRun, steps.length, error]);

  // Playback Logic
  useEffect(() => {
    if (isPlaying && currentStepIndex < steps.length - 1) {
      timerRef.current = window.setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, playbackSpeed);
    } else if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStepIndex, steps.length, playbackSpeed]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const stepForward = () => setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
  const stepBack = () => setCurrentStepIndex(prev => Math.max(prev - 1, 0));

  // AI Actions
  const handleQuickAnalysis = async () => {
    setIsAnalyzing(true);
    // Expand analysis panel if collapsed (optional UX)
    const result = await analyzeCode(code);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleGenerateCode = async () => {
      if (!aiPrompt.trim()) return;
      setIsGenerating(true);
      const newCode = await generateAlgorithmCode(aiPrompt);
      if (newCode) setCode(newCode);
      setIsGenerating(false);
      setAiPrompt("");
      // Auto run after generation
      setTimeout(handleRun, 100);
  };

  // Derived State
  const currentStep = steps[currentStepIndex] || { array: data, highlights: [], description: "Ready to run" };
  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-secondary/30 bg-surface/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg">
            <Code2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent hidden sm:block">AlgoViz AI</h1>
        </div>
        
        <div className="flex items-center gap-4">
           
           {/* Analysis Button */}
           <button 
                onClick={handleQuickAnalysis}
                disabled={isAnalyzing}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all"
           >
                {isAnalyzing ? <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
                Analyze
           </button>

           {/* Code Gen Input */}
           <div className="flex items-center bg-background border border-secondary/40 rounded-full px-4 py-1.5 focus-within:border-primary transition-colors">
             <input 
                className="bg-transparent outline-none text-sm w-48 md:w-64 placeholder-gray-500"
                placeholder="Generate (e.g. Quick Sort)"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerateCode()}
             />
             <button 
                onClick={handleGenerateCode}
                disabled={isGenerating || !aiPrompt}
                className="ml-2 text-primary hover:text-blue-400 disabled:opacity-50"
             >
                {isGenerating ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
             </button>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left: Code Editor */}
        <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-secondary/30 h-1/2 lg:h-full">
          <div className="flex-1 p-0 relative min-h-0">
             <CodeEditor 
                code={code} 
                onChange={setCode} 
                onRun={handleRun}
             />
          </div>
        </div>

        {/* Right: Visualization & Output */}
        <div className="w-full lg:w-1/2 flex flex-col bg-background/50 h-1/2 lg:h-full">
          
          {/* Analysis Result Panel (Top of Right Column) */}
          {analysis && (
              <div className="p-4 bg-surface/50 border-b border-secondary/30 animate-in fade-in slide-in-from-top-2 shrink-0 max-h-40 overflow-y-auto">
                   <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-accent flex items-center gap-2 text-sm"><Zap className="w-3 h-3" /> AI Analysis</span>
                      <button onClick={() => setAnalysis("")}><XIcon className="w-3 h-3 text-secondary hover:text-white" /></button>
                   </div>
                   <p className="text-gray-300 text-sm leading-relaxed">{analysis}</p>
              </div>
          )}

          {/* Visualizer Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 relative min-h-0">
             
             <div className="w-full h-full flex flex-col items-center justify-center">
                 <div className="w-full flex-1 min-h-0">
                    <Visualizer 
                        data={currentStep.array} 
                        highlights={currentStep.highlights} 
                        width={600} 
                        height={300} 
                    />
                 </div>
                 <div className="mt-4 text-center shrink-0">
                     <p className="text-lg font-medium text-white mb-1 transition-all">{currentStep.description}</p>
                     <p className="text-sm text-secondary font-mono">
                         Step {currentStepIndex + 1} / {Math.max(steps.length, 1)}
                     </p>
                 </div>
             </div>

             {/* Error Toast */}
             {error && (
                 <div className="absolute top-6 left-6 right-6 bg-error/10 border border-error/50 text-error px-4 py-3 rounded-lg flex items-center gap-3 z-20">
                     <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                     <p className="text-sm font-mono">{error}</p>
                 </div>
             )}
          </div>

          {/* Controls */}
          <div className="bg-surface border-t border-secondary/30 flex items-center justify-between px-4 py-3 shrink-0">
             
             <div className="flex items-center gap-2 w-1/3">
                <button onClick={handleReset} className="p-2 hover:bg-white/5 rounded-full text-secondary hover:text-white transition-colors" title="New Random Data">
                    <RefreshCw className="w-5 h-5" />
                </button>
                
                {/* Speed Slider */}
                <div className="flex flex-col ml-2 w-24 sm:w-32 hidden sm:flex">
                    <label className="text-[10px] text-secondary uppercase font-bold tracking-wider mb-1">Speed</label>
                    <input 
                        type="range" 
                        min="50" 
                        max="1000" 
                        step="50"
                        value={1050 - playbackSpeed} // Invert so right is faster
                        onChange={(e) => setPlaybackSpeed(1050 - Number(e.target.value))}
                        className="h-1 bg-secondary/30 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                    />
                </div>
             </div>

             <div className="flex items-center gap-2 sm:gap-4 justify-center w-1/3">
                 <button onClick={stepBack} disabled={currentStepIndex <= 0} className="p-2 rounded-full text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all">
                     <StepBack className="w-5 h-5 sm:w-6 sm:h-6" />
                 </button>
                 <button 
                    onClick={togglePlay} 
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all ${isPlaying ? 'bg-error text-white' : 'bg-primary text-white'}`}
                 >
                     {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-1" />}
                 </button>
                 <button onClick={stepForward} disabled={currentStepIndex >= steps.length - 1} className="p-2 rounded-full text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all">
                     <StepForward className="w-5 h-5 sm:w-6 sm:h-6" />
                 </button>
             </div>

             <div className="w-1/3 flex items-center justify-end">
                  <div className="bg-background rounded-full px-3 py-1 border border-secondary/30">
                      <span className="text-[10px] sm:text-xs text-secondary font-mono whitespace-nowrap">
                          {steps.length > 0 ? 'READY' : 'WAITING'}
                      </span>
                  </div>
             </div>
          </div>
          
          {/* Progress Bar */}
          <div className="h-1 bg-surface w-full shrink-0">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
          </div>

        </div>
      </main>

      <ChatWidget />
    </div>
  );
}

const XIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
)

export default App;