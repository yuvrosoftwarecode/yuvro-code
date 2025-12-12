import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

const AIChatInput: React.FC<{ onSend: (text: string) => Promise<void>; disabled?: boolean }> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    try {
      await onSend(trimmed);
    } catch (err) {
      console.error('Send failed', err);
    }
  };

  return (
    <div className="relative">
      <Sparkles size={16} className="absolute left-3 top-3 text-emerald-500" />
      <input
        className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
        placeholder="Ask Buddy..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
        disabled={disabled}
      />
      <button
        className={`absolute right-1.5 top-1.5 p-1.5 rounded-full transition-colors ${text.trim() === '' || disabled
          ? 'text-gray-400 cursor-not-allowed bg-gray-100'
          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
          }`}
        onClick={handleSend}
        disabled={disabled || text.trim() === ''}
      >
        <Send size={16} className={text.trim() === '' ? 'ml-0.5' : 'ml-0.5'} />
      </button>
    </div>
  );
};

export default AIChatInput;
