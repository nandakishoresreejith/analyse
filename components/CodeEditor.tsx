import React, { useState, useEffect } from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  onRun: () => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, onRun }) => {
  const [lines, setLines] = useState(1);

  useEffect(() => {
    setLines(code.split('\n').length);
  }, [code]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      onChange(newValue);
      
      // Restore cursor position
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      onRun();
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-background border border-secondary/30 rounded-lg overflow-hidden font-mono text-sm">
      <div className="flex-1 flex relative overflow-hidden">
        {/* Line Numbers */}
        <div className="bg-surface text-secondary text-right pr-3 pt-4 select-none w-12 border-r border-secondary/30">
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className="leading-6 h-6">{i + 1}</div>
          ))}
        </div>
        
        {/* Editor Area */}
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-gray-200 p-4 pt-4 outline-none resize-none leading-6 whitespace-pre tab-4"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
      </div>
      <div className="bg-surface px-4 py-2 border-t border-secondary/30 text-xs text-secondary flex justify-between items-center">
        <span>JavaScript</span>
        <span>Cmd/Ctrl + Enter to Run</span>
      </div>
    </div>
  );
};

export default CodeEditor;