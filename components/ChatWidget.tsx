import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Bot, User, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';
import { createChatSession, sendMessageToChat } from '../services/geminiService';
import { Chat } from '@google/genai';

interface ChatWidgetProps {
  initialMessage?: string;
  onCodeRequest?: (code: string) => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ initialMessage, onCodeRequest }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chatSessionRef.current) {
      chatSessionRef.current = createChatSession();
      if (initialMessage) {
         setMessages([{ id: 'init', role: 'model', text: initialMessage }]);
      } else {
        setMessages([{ id: 'init', role: 'model', text: "Hi! I'm your coding assistant. Ask me about sorting algorithms or help debugging your code." }]);
      }
    }
  }, [isOpen, initialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const responseText = await sendMessageToChat(chatSessionRef.current, userMsg.text);

    const modelMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
    setMessages(prev => [...prev, modelMsg]);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      {isOpen && (
        <div className="pointer-events-auto w-96 h-[500px] bg-background border border-secondary/40 rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          
          {/* Header */}
          <div className="bg-surface p-4 border-b border-secondary/30 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <span className="font-semibold text-white">Gemini Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-secondary hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary' : 'bg-surface border border-secondary/30'}`}>
                   {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-primary" />}
                </div>
                <div className={`max-w-[80%] rounded-xl p-3 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white' 
                    : 'bg-surface border border-secondary/30 text-gray-200'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-surface border border-secondary/30 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                 </div>
                 <div className="bg-surface border border-secondary/30 rounded-xl p-3 flex items-center gap-1">
                   <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                   <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                   <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-surface border-t border-secondary/30">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about the code..."
                className="w-full bg-background border border-secondary/40 rounded-full pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-2 p-1.5 bg-primary rounded-full text-white hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto bg-primary hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center gap-2"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default ChatWidget;