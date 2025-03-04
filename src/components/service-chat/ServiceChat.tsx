
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

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
  const [isOpen, setIsOpen] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Log the request being sent with more detail - avoid using protected 'url' property
      console.log('Sending request to telegram-bot function with message:', {
        messageText: userMessage,
        timestamp: new Date().toISOString(),
        // Using an alternative approach to log the endpoint information
        endpoint: 'telegram-bot'
      });

      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { 
          message: { text: userMessage },
          // Adding debugging info to help diagnose issues
          debug: {
            timestamp: new Date().toISOString(),
            origin: window.location.origin,
            route: window.location.pathname
          }
        }
      });

      console.log('Response from telegram-bot:', { data, error });

      if (error) {
        throw new Error(`Error calling telegram-bot: ${error.message}`);
      }

      if (data && data.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
      } else {
        throw new Error('Invalid response format from telegram-bot');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      
      toast({
        variant: "destructive",
        title: "Error sending message",
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
      
      // Add error message as assistant's response to improve UX
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I couldn't process your message. Please try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }

    onSendMessage(userMessage);
  };

  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4">
        <Button 
          onClick={toggleChat}
          className="rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
        >
          <span className="sr-only">Open chat</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-[350px] bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-medium">Chat with {businessName}</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={toggleChat}
        >
          <span className="sr-only">Close chat</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </Button>
      </div>
      
      <ScrollArea className="h-[300px] p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 my-8">
              <p>Send a message to get started</p>
            </div>
          )}
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
