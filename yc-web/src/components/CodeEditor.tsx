import React from 'react';
import MonacoEditor, { loader } from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  onLanguageChange?: (language: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  height?: string;
}

loader.init().then(monaco => {
  monaco.editor.defineTheme('custom-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editorLineNumber.background': '#f3f4f6', // Tailwind gray-100
      'editorGutter.background': '#f3f4f6',
    },
  });
});

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  onLanguageChange,
  placeholder = "Write your code here...",
  readOnly = false,
  height = "400px"
}) => {

  return (
    <div className="relative rounded-lg overflow-hidden bg-white" style={{ height }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100">
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-800 font-medium">Select Language</span>
          {onLanguageChange && (
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="text-xs bg-gray-200 text-gray-800 border border-gray-300 rounded px-2 py-1"
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
          <span className="text-xs text-gray-500">
            Lines: {value.split('\n').length}
          </span>
          <span className="text-xs text-gray-500">
            Chars: {value.length}
          </span>
        </div>
      </div>

      {/* Monaco Editor */}
      <MonacoEditor
        height={`calc(${height} - 48px)`}
        language={language}
        value={value}
        onChange={(val: string | undefined) => onChange(val ?? '')}
        theme="custom-light"
        options={{
          readOnly,
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          lineNumbers: 'on',
        }}
      />
    </div>
  );
};

export default CodeEditor;