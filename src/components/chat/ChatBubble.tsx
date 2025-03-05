
import React from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { ChatInterface } from './ChatInterface';

export const ChatBubble: React.FC = () => {
  const { chatState, toggleChat } = useChat();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {chatState.isOpen ? (
        <div className="relative">
          <ChatInterface />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 rounded-full h-8 w-8 bg-gray-200 text-gray-700 hover:bg-gray-300"
            onClick={toggleChat}
          >
            <X size={18} />
          </Button>
        </div>
      ) : (
        <Button
          onClick={toggleChat}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 text-white shadow-lg"
        >
          <MessageCircle size={24} />
        </Button>
      )}
    </div>
  );
};
