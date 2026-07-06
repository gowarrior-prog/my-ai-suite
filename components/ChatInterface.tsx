"use client";
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import ChatHeader from './ChatHeader';
import MessageStream from './MessageStream';
import CommandInput from './CommandInput';

type ChatInterfaceProps = {
  currentChat: {
    id: string;
    title: string;
    messages: { 
      role: string; 
      content: string;
      fileAttachment?: { name: string; type: string; urlData: string };
    }[];
  } | null;
  onUpdateMessages: (messages: any[]) => void;
};

export default function ChatInterface({ currentChat, onUpdateMessages }: ChatInterfaceProps) {
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messages = currentChat?.messages || [];

  // 🚀 FIXED SECURE MULTI-TURN DISPATCH WITH ATTACHMENTS
  const handleSendMessage = async (
    text: string, 
    base64Images: string[], 
    fileMeta?: { name: string; type: string; urlData: string }
  ) => {
    if (!currentChat || loading) return;

    const userMsg = text.trim();
    
    // Construct new user block containing optional attached elements data
    const newUserNode: any = { role: 'user', content: userMsg };
    if (fileMeta) {
      newUserNode.fileAttachment = fileMeta;
    }

    const newMessages = [...messages, newUserNode];
    
    // UI parameters state timeline updates instantly
    onUpdateMessages(newMessages);
    setLoading(true);

    try {
      const cleanImages = Array.isArray(base64Images) 
        ? base64Images.filter(img => typeof img === 'string' && img.length > 0) 
        : [];

      // Extract raw type elements cleanly, dropping prototype bindings to avoid 400 errors
      const dynamicHistory = messages.map(msg => {
        const cleanNode: any = {
          role: String(msg.role),
          content: String(msg.content)
        };
        // If image binaries present inside history payload tracker array
        if (msg.role === 'user' && cleanImages.length > 0 && messages.indexOf(msg) === messages.length - 1) {
          cleanNode.images = cleanImages;
        }
        return cleanNode;
      });

      // Construct latest active frame parameters for the server core block
      const dynamicCurrent: any = {
        role: 'user',
        content: userMsg
      };

      if (cleanImages.length > 0) {
        dynamicCurrent.images = cleanImages;
      }

      const fullPayloadPack = [...dynamicHistory, dynamicCurrent];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          historyPayload: fullPayloadPack 
        }),
      });

      const data = await res.json();
      
      if (res.ok && data.reply) {
        onUpdateMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      } else {
        onUpdateMessages([...newMessages, { role: 'assistant', content: data.reply || "Server internal issue encountered." }]);
      }
      
    } catch (err) {
      console.error("Local context crash loop telemetry:", err);
      onUpdateMessages([...newMessages, { role: 'assistant', content: "Local network socket gateway failed to communicate." }]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter(msg => 
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentChat) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 bg-[#07090c] p-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600/20 to-cyan-500/20 rounded-2xl flex items-center justify-center border border-cyan-500/20 mb-4 animate-pulse">
          <Sparkles className="text-cyan-400" size={28} />
        </div>
        <h2 className="text-xl font-bold text-white tracking-wide">Neuro Core Intelligence</h2>
        <p className="text-xs text-gray-500 mt-1.5 max-w-xs leading-relaxed">
          Sidebar se <strong className="text-gray-300">"New Chat"</strong> select karein taake workspace telemetry pipeline shuru kiya ja sake.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#07090c] text-gray-200 overflow-hidden">
      <ChatHeader 
        currentChatId={currentChat.id}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
      />

      <MessageStream 
        filteredMessages={filteredMessages}
        searchQuery={searchQuery}
        loading={loading}
      />

      <CommandInput 
        onSendMessage={handleSendMessage}
        loading={loading}
      />
    </div>
  );
}
