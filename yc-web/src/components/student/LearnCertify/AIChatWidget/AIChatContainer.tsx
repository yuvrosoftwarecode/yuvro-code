import React from 'react';
import AIChatMessages from './ChatMessages';
import AIChatInput from './ChatInput';
import useAIChat from './useAIChat';
import { History as HistoryIcon, Clock, X, Plus } from 'lucide-react';

const AIChatContainer: React.FC<{ className?: string, contextGetter?: () => string, welcomeMessage?: string, persistenceKey?: string, chatTitle?: string, onNewChat?: () => void }> = ({ className, contextGetter, welcomeMessage, persistenceKey, chatTitle, onNewChat }) => {
  const { messages, sendMessage, isLoading, clearMessages, history, loadSession } = useAIChat({ getContext: contextGetter, persistenceKey, chatTitle });
  const [showHistory, setShowHistory] = React.useState(false);

  return (
    <div className={`ai-chat-container flex flex-col bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200 ring-4 ring-gray-50/50 ${className || 'w-[360px] h-[500px]'}`}>
      <div className="ai-chat-header px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-white via-blue-50/30 to-white relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <div className="text-sm font-semibold text-gray-800">AI Buddy</div>
          </div>
          <div className="flex items-center gap-2">
            {persistenceKey && (
              <>
                <button
                  onClick={onNewChat}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title="New Chat"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`p-1.5 rounded-full transition-colors ${showHistory ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                  title="Recent Chats"
                >
                  <HistoryIcon size={16} />
                </button>
              </>
            )}
            <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">Plus</span>
          </div>
        </div>

        {/* History Dropdown */}
        {showHistory && (
          <div className="absolute top-12 left-0 right-0 mx-4 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-[300px] overflow-y-auto">
            <div className="p-2 sticky top-0 bg-white border-b border-gray-50 flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-2">Recent Chats</span>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={14} /></button>
            </div>
            {history.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">No recent chats</div>
            ) : (
              <div className="py-1">
                {history.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => { loadSession(item.key); setShowHistory(false); }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors group ${persistenceKey === item.key ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="text-sm font-medium text-gray-800 group-hover:text-blue-600 truncate">{item.title}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(item.date).toLocaleDateString()} • {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AIChatMessages messages={messages} isLoading={isLoading} welcomeMessage={welcomeMessage} />

      <div className="ai-chat-footer border-t border-gray-100 p-3 bg-gray-50/30">
        <AIChatInput onSend={sendMessage} disabled={isLoading} />
        <div className="flex justify-between items-center mt-2 px-1">
          <span className="text-[10px] text-gray-400">Powered by Yuvro AI</span>
          <button onClick={clearMessages} className="text-xs text-gray-500 hover:text-red-500 transition-colors">Clear Chat</button>
        </div>
      </div>
    </div>
  );
};

export default AIChatContainer;
