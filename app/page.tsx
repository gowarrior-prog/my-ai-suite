"use client";

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import RightIntelPanel from '@/components/RightIntelPanel';

type AttachedFileMeta = {
  name: string;
  type: string;
  urlData: string;
};

type ChatMessage = {
  role: 'user' | 'assistant' | 'system' | string;
  content: string;
  fileAttachment?: AttachedFileMeta;
};

type Chat = {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: string;
};

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);

  useEffect(() => {
    // Set sidebar open state depending on screen size
    if (typeof window !== 'undefined') {
      setSidebarOpen(window.innerWidth >= 1024);
    }

    const saved = localStorage.getItem('neuro-chats');
    if (!saved) return;

    try {
      const chats: Chat[] = JSON.parse(saved);
      if (chats.length > 0) {
        setCurrentChat(chats[0]);
      }
    } catch (error) {
      console.error('Failed to parse stored chats:', error);
    }
  }, []);

  const handleCreateNewChat = () => {
    const saved = localStorage.getItem('neuro-chats');
    let currentChats: Chat[] = [];

    if (saved) {
      try {
        currentChats = JSON.parse(saved);
      } catch (error) {
        console.error('Failed to parse stored chats:', error);
      }
    }

    const emptyChatExists = currentChats.find((c) => c.messages.length === 0);
    if (emptyChatExists) {
      setCurrentChat(emptyChatExists);
      return;
    }

    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      timestamp: new Date().toISOString(),
    };

    const updated = [newChat, ...currentChats];
    localStorage.setItem('neuro-chats', JSON.stringify(updated));
    setCurrentChat(newChat);
  };

  const handleUpdateChatMessages = (chatId: string, updatedMessages: ChatMessage[]) => {
    const saved = localStorage.getItem('neuro-chats');
    if (!saved) return;

    try {
      const chats: Chat[] = JSON.parse(saved);

      const updatedChats = chats.map((c) => {
        if (c.id !== chatId) return c;

        const firstUserMessage = updatedMessages.find((m) => m.role === 'user');
        let currentTitle = c.title;

        if (c.title === 'New Chat' && firstUserMessage) {
          currentTitle =
            firstUserMessage.content.length > 25
              ? firstUserMessage.content.substring(0, 25) + '...'
              : firstUserMessage.content;
        }

        return {
          ...c,
          messages: updatedMessages,
          title: currentTitle,
        };
      });

      localStorage.setItem('neuro-chats', JSON.stringify(updatedChats));

      const active = updatedChats.find((c) => c.id === chatId) ?? null;
      setCurrentChat(active);
    } catch (error) {
      console.error('Failed to update chat messages:', error);
    }
  };

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden bg-[#050709] text-gray-200 select-none antialiased">
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onChatSelect={setCurrentChat}
        currentChatId={currentChat?.id || null}
        onCreateNewChat={handleCreateNewChat}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden border-r border-white/[0.05] bg-transparent">
        <ChatInterface
          currentChat={currentChat}
          onUpdateMessages={(msgs) =>
            currentChat && handleUpdateChatMessages(currentChat.id, msgs)
          }
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      <RightIntelPanel />
    </div>
  );
}