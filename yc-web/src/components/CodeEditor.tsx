import React, { useState, useRef, useEffect } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  onLanguageChange?: (language: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  height?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  onLanguageChange,
  placeholder = "Write your code here...",
  readOnly = false,
  height = "400px"
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const getLanguageClass = (lang: string) => {
    // Add basic syntax highlighting classes based on language
    const languageClasses: { [key: string]: string } = {
      'python': 'language-python',
      'javascript': 'language-javascript',
      'java': 'language-java',
      'cpp': 'language-cpp',
      'c': 'language-c'
    };
    return languageClasses[lang.toLowerCase()] || 'language-text';
  };

  if (readOnly) {
    return (
      <div className="border rounded-lg overflow-hidden bg-gray-900" style={{ height }}>
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <span className="text-sm text-gray-300 font-medium">{language.toUpperCase()}</span>
          <span className="text-xs text-gray-400">Read Only</span>
        </div>
        <pre className={`text-gray-100 p-4 h-full overflow-auto font-mono text-sm ${getLanguageClass(language)}`}>
          {value || placeholder}
        </pre>
      </div>
    );
  }

  return (
    <div className="relative border rounded-lg overflow-hidden bg-gray-900" style={{ height }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-300 font-medium">{language.toUpperCase()}</span>
          {onLanguageChange && (
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="text-xs bg-gray-700 text-gray-300 border border-gray-600 rounded px-2 py-1"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
            </select>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">
            Lines: {value.split('\n').length}
          </span>
          <span className="text-xs text-gray-400">
            Chars: {value.length}
          </span>
        </div>
      </div>

      {/* Editor */}
      <div className="relative flex-1" style={{ height: `calc(${height} - 80px)` }}>
        {/* Line numbers */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-800 border-r border-gray-700 flex flex-col text-xs text-gray-500 font-mono">
          {value.split('\n').map((_, index) => (
            <div key={index} className="px-2 py-0.5 text-right leading-6">
              {index + 1}
            </div>
          ))}
        </div>

        {/* Code textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          placeholder={placeholder}
          className={`
            absolute inset-0 w-full h-full pl-14 pr-4 py-2 font-mono text-sm resize-none
            bg-transparent text-gray-100 border-none outline-none
            ${isEditing ? 'ring-2 ring-blue-500 ring-inset' : ''}
            leading-6
          `}
          style={{
            fontSize: '14px',
            lineHeight: '1.5',
            tabSize: 2,
            minHeight: '200px'
          }}
          spellCheck={false}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-1 bg-gray-800 border-t border-gray-700 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Tab for indent • Ctrl+A to select all
        </span>
        <span className="text-xs text-gray-400">
          {isEditing ? 'Editing...' : 'Ready'}
        </span>
      </div>
    </div>
  );
};

export default CodeEditor;