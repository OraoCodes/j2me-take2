
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ServiceChatProps {
  businessName: string;
  onSendMessage: (message: string) => void;
}

const ServiceChat = ({ businessName, onSendMessage }: ServiceChatProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { message: { text: userMessage, chat: { id: 'web' } } }
      });

      if (error) throw error;

      if (data) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text || 'Sorry, I could not process your request.' }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your message. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }

    // Call the parent's onSendMessage for any additional handling
    onSendMessage(userMessage);
  };

  return (
    <div className="fixed bottom-4 right-4 w-[350px] bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b">
        <h3 className="font-medium">Chat with {businessName}</h3>
      </div>
      
      <ScrollArea className="h-[300px] p-4">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-primary text-white ml-8' 
                  : 'bg-gray-100 text-gray-900 mr-8'
              }`}
            >
              {msg.content}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="animate-pulse">Wairimu is typing...</div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ServiceChat;
