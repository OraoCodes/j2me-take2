
import React, { useRef, useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/contexts/ChatContext';

export const ChatInterface: React.FC = () => {
  const { chatState, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatState.messages]);

  // Focus input on open
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatState.isLoading) return;
    
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  return (
    <div className="bg-white rounded-lg shadow-xl flex flex-col w-[350px] h-[450px] border overflow-hidden">
      <div className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange p-4 text-white">
        <h3 className="font-semibold">Jitume Assistant</h3>
        <p className="text-sm opacity-90">How can I help you today?</p>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4" ref={scrollRef}>
          {chatState.messages.length === 0 && (
            <div className="text-center text-muted-foreground p-4">
              <p>👋 Welcome to Jitume! Ask me anything about the platform.</p>
              <div className="mt-4 space-y-2">
                <SuggestionButton onClick={() => sendMessage("How do I add a service?")}>
                  How do I add a service?
                </SuggestionButton>
                <SuggestionButton onClick={() => sendMessage("Where can I see my requests?")}>
                  Where can I see my requests?
                </SuggestionButton>
                <SuggestionButton onClick={() => sendMessage("Take me to my dashboard")}>
                  Take me to my dashboard
                </SuggestionButton>
              </div>
            </div>
          )}
          
          {chatState.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white'
                    : 'bg-gray-100'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          
          {chatState.isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[80%]">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
          disabled={chatState.isLoading}
        />
        <Button 
          type="submit" 
          size="icon"
          className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90"
          disabled={chatState.isLoading || !input.trim()}
        >
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
};

// Helper component for suggestion buttons
const SuggestionButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ 
  onClick, 
  children 
}) => (
  <button
    type="button"
    onClick={onClick}
    className="bg-gray-100 text-gray-800 text-sm py-1 px-3 rounded-full hover:bg-gray-200 transition-colors w-full text-left"
  >
    {children}
  </button>
);
