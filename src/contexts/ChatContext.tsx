
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { ChatMessage, ChatState } from '@/types/chat';
import { useToast } from '@/components/ui/use-toast';

interface ChatContextProps {
  chatState: ChatState;
  toggleChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isOpen: false,
    isLoading: false,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const toggleChat = useCallback(() => {
    setChatState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const clearChat = useCallback(() => {
    setChatState(prev => ({ ...prev, messages: [] }));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));

    try {
      // Simple bot response logic - will be enhanced in a real implementation
      const response = await processMessage(content, navigate);
      
      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error processing message:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process your request. Please try again.",
      });
      setChatState(prev => ({ ...prev, isLoading: false }));
    }
  }, [navigate, toast]);

  return (
    <ChatContext.Provider value={{ chatState, toggleChat, sendMessage, clearChat }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextProps => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

// Helper function to process messages
async function processMessage(content: string, navigate: ReturnType<typeof useNavigate>): Promise<string> {
  const lowerContent = content.toLowerCase();
  
  // Navigation assistance
  if (lowerContent.includes('dashboard') || lowerContent.includes('home')) {
    setTimeout(() => navigate('/dashboard'), 1000);
    return "I'll take you to the dashboard right away!";
  }
  
  if (lowerContent.includes('profile') || lowerContent.includes('account')) {
    setTimeout(() => navigate('/profile'), 1000);
    return "Redirecting you to your profile settings!";
  }
  
  if (lowerContent.includes('service') && lowerContent.includes('add')) {
    setTimeout(() => navigate('/add-services'), 1000);
    return "Let's get your new service added. Taking you to the service creation page!";
  }
  
  if (lowerContent.includes('settings')) {
    setTimeout(() => navigate('/settings'), 1000);
    return "Taking you to the settings page!";
  }
  
  if (lowerContent.includes('payment') || lowerContent.includes('billing')) {
    setTimeout(() => navigate('/payment-methods'), 1000);
    return "Let me show you the payment methods page!";
  }
  
  if (lowerContent.includes('share') || lowerContent.includes('social')) {
    setTimeout(() => navigate('/social-links'), 1000);
    return "I'll take you to the social sharing settings!";
  }
  
  // FAQ responses
  if (lowerContent.includes('how') && lowerContent.includes('add service')) {
    return "To add a new service, go to the dashboard and click on the '+ Add Service' button. You'll be guided through the process of setting up your service details, pricing, and availability.";
  }
  
  if (lowerContent.includes('how') && lowerContent.includes('get paid')) {
    return "You can set up your payment methods in the Payment Methods section. We support various payment options including mobile money and bank transfers. Would you like me to take you there?";
  }
  
  if (lowerContent.includes('how') && lowerContent.includes('share')) {
    return "You can share your services on social media or directly with your clients. Go to the Service Share page to get your unique sharing links and QR codes. Would you like me to take you there?";
  }
  
  // General responses
  if (lowerContent.includes('hello') || lowerContent.includes('hi')) {
    return "Hello! I'm your Jitume assistant. How can I help you today?";
  }
  
  // Default response
  return "I'm here to help you with the Jitume platform. You can ask me about adding services, managing your profile, payment options, or navigating to different sections of the app.";
}
