
'use client';

import React, { useState, useRef, useEffect, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bot, Loader2, Send, X, ArrowDown } from 'lucide-react';
import { chatbotAssistant, type ChatbotAssistantInput } from '@/ai/flows/chatbot-assistant';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { User, WithId } from '@/lib/types';
import Markdown from 'react-markdown';

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
};

interface ChatbotWidgetProps {
  userProfile: WithId<User> | null;
}

export function ChatbotWidget({ userProfile }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, setIsPending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string | undefined | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('');
  };

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      if (messages.length === 0) {
        setMessages([
          {
            id: 'initial',
            role: 'model',
            content: `Hello ${userProfile?.name || 'there'}! I'm Leo, your AI assistant. How can I help you today?`,
          },
        ]);
      }
    }
  }, [isOpen, messages.length, userProfile]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsPending(true);

    const chatHistory = [...messages, userMessage].map(msg => ({
      role: msg.role,
      content: [{ text: msg.content }],
    }));

    try {
      const result = await chatbotAssistant({ messages: chatHistory });
      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: result.response,
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I'm sorry, but I encountered an error. Please try again in a moment.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-80 h-[28rem] flex flex-col shadow-2xl rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <CardTitle className="text-lg">Leo Assistant</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
             <ScrollArea className="flex-1 p-3" ref={scrollAreaRef}>
                <div className="space-y-4">
                {messages.map(message => (
                    <div
                    key={message.id}
                    className={cn(
                        'flex items-end gap-2',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                    >
                    {message.role === 'model' && (
                        <Avatar className="h-7 w-7 bg-primary text-primary-foreground">
                            <AvatarFallback>
                                <Bot className="h-4 w-4"/>
                            </AvatarFallback>
                        </Avatar>
                    )}
                    <div
                        className={cn(
                        'max-w-[80%] rounded-lg p-2 text-sm',
                        message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                    >
                       <div className="prose prose-sm dark:prose-invert max-w-full">
                         <Markdown>{message.content}</Markdown>
                       </div>
                    </div>
                     {message.role === 'user' && (
                        <Avatar className="h-7 w-7">
                            <AvatarFallback>
                                {getInitials(userProfile?.name)}
                            </AvatarFallback>
                        </Avatar>
                    )}
                    </div>
                ))}
                 {isPending && (
                    <div className="flex items-end gap-2 justify-start">
                        <Avatar className="h-7 w-7 bg-primary text-primary-foreground">
                            <AvatarFallback>
                                <Bot className="h-4 w-4"/>
                            </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted p-2 rounded-lg flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                )}
                </div>
            </ScrollArea>
             <form onSubmit={handleSubmit} className="p-3 border-t">
              <div className="relative">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="pr-10"
                  disabled={isPending}
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  disabled={isPending || !input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button
          size="lg"
          className="rounded-full shadow-lg h-16 w-16"
          onClick={() => setIsOpen(true)}
        >
          <Bot className="h-8 w-8" />
        </Button>
      )}
    </div>
  );
}
