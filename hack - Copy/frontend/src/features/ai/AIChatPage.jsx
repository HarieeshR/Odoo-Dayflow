import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sendMessage } from '../../services/aiService';
import Button from '../../components/ui/Button';
import { formatDistanceToNow } from 'date-fns';

const AIChatPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const messagesEndRef = useRef(null);
  
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am Dayflow AI. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const employeeSuggestions = [
    "How many paid leaves do I have?",
    "How many days was I absent this month?",
    "What is my salary structure?",
    "What was my average working time?",
    "How many extra hours did I work?",
    "Summarize my attendance this month"
  ];

  const adminSuggestions = [
    "How many employees are absent today?",
    "Which department has highest leave usage?",
    "Show pending leave requests",
    "Summarize this month's attendance",
    "Show overall payroll statistics",
    "Which employees have unusual attendance?"
  ];

  const suggestions = isAdmin ? adminSuggestions : employeeSuggestions;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (text) => {
    if (!text.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await sendMessage(text.trim());
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res?.reply || res?.message || res?.data || "I'm sorry, I couldn't process that.",
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      let errorMsg = "An error occurred while connecting to Dayflow AI.";
      if (err.response?.status === 404 || err.response?.status === 501) {
        errorMsg = "AI assistant is not available. Please contact your administrator.";
      }
      
      const aiError = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date(),
        isError: true
      };
      setMessages((prev) => [...prev, aiError]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  // Simple Markdown Parser for bold and bullets
  const parseMessageContent = (content) => {
    if (!content) return null;
    
    // Split by new lines for basic paragraph / bullet handling
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
      // Bold text `**text**`
      const boldRegex = /\*\*(.*?)\*\*/g;
      
      // Handle bullets
      const isBullet = line.trim().startsWith('- ');
      const isNumber = /^\d+\.\s/.test(line.trim());
      
      let parsedLine = line;
      if (isBullet) {
        parsedLine = line.replace(/^- /, '');
      }
      
      // Render line parts with bold replacement
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(parsedLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(parsedLine.substring(lastIndex, match.index));
        }
        parts.push(<strong key={`bold-${index}-${match.index}`}>{match[1]}</strong>);
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < parsedLine.length) {
        parts.push(parsedLine.substring(lastIndex));
      }

      if (isBullet) {
        return (
          <li key={index} className="ml-4 list-disc mb-1 text-sm">
            {parts.length > 0 ? parts : parsedLine}
          </li>
        );
      } else if (isNumber) {
        return (
          <div key={index} className="mb-1 text-sm">
            {parts.length > 0 ? parts : parsedLine}
          </div>
        );
      }
      
      return (
        <p key={index} className="mb-2 text-sm last:mb-0">
          {parts.length > 0 ? parts : parsedLine}
          {parts.length === 0 && !parsedLine && <br />}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-6rem)] bg-gray-50 rounded-lg shadow overflow-hidden">
      
      {/* Suggestions Panel (Hidden on small screens by default) */}
      <div className="hidden md:flex md:w-64 lg:w-80 bg-white border-r border-gray-200 flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Suggested Questions
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(suggestion)}
              className="w-full text-left p-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-sm text-blue-800 transition-colors shadow-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-white">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] lg:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${
                  msg.role === 'user' ? 'bg-blue-600 ml-3' : 'bg-indigo-600 mr-3'
                }`}>
                  {msg.role === 'user' ? (
                    <span className="text-white text-xs font-bold">
                      {user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  ) : (
                    <span className="text-white text-xs font-bold">✨</span>
                  )}
                </div>

                {/* Message Bubble */}
                <div className="flex flex-col">
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : msg.isError 
                          ? 'bg-red-50 text-red-700 rounded-tl-none border border-red-200'
                          : 'bg-gray-100 text-gray-800 rounded-tl-none'
                    }`}
                  >
                    {parseMessageContent(msg.content)}
                  </div>
                  <span className={`text-[10px] text-gray-400 mt-1 ${
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {msg.timestamp ? formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true }) : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="flex max-w-[80%] flex-row">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 mr-3">
                  <span className="text-white text-xs font-bold">✨</span>
                </div>
                <div className="px-4 py-3 rounded-2xl bg-gray-100 rounded-tl-none shadow-sm flex items-center space-x-1.5 h-12">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Dayflow AI anything... (Shift+Enter for new line)"
                className="w-full resize-none bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm h-12 max-h-32 overflow-y-auto leading-relaxed"
                rows={1}
                disabled={loading}
              />
            </div>
            <Button
              onClick={() => handleSend(inputValue)}
              disabled={loading || !inputValue.trim()}
              className="h-12 px-6 rounded-xl flex items-center justify-center flex-shrink-0"
            >
              <svg className="w-5 h-5 mr-0 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span className="hidden md:inline">Send</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
