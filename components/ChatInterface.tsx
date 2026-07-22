"use client";
import { useState } from 'react';
import { Sparkles, Menu } from 'lucide-react';
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
  onToggleSidebar?: () => void;
};

export default function ChatInterface({ currentChat, onUpdateMessages, onToggleSidebar }: ChatInterfaceProps) {
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messages = currentChat?.messages || [];

  // 🚀 FIXED SECURE MULTI-TURN DISPATCH WITH ATTACHMENTS
  const handleSendMessage = async (
    text: string, 
    base64Images: string[], 
    fileMeta?: { name: string; type: string; urlData: string },
    docContent?: string
  ) => {
    if (!currentChat || loading) return;

    const userMsg = text.trim();
    
    // Construct new user block containing optional attached elements data
    const newUserNode: any = { role: 'user', content: userMsg || (fileMeta ? `Attached File: ${fileMeta.name}` : "") };
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
      // Inject docContent ONLY into payload, keeping UI clean.
      const payloadContent = docContent 
        ? (userMsg ? `${userMsg}\n\n--- Document Content ---\n${docContent}` : docContent) 
        : userMsg;

      const dynamicCurrent: any = {
        role: 'user',
        content: payloadContent
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
      <div className="h-full flex flex-col bg-transparent text-gray-200 overflow-hidden relative">
        {/* Mobile-only header when no chat selected */}
        <div className="h-14 border-b border-white/[0.03] flex items-center px-4 bg-[#050709]/80 backdrop-blur-md lg:hidden z-30">
          <button 
            onClick={onToggleSidebar}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            aria-label="Toggle Sidebar"
          >
            <Menu size={18} />
          </button>
          <span className="font-black text-xs tracking-wider text-white ml-3">MY-AI-SUITE</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="w-20 h-20 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 rounded-3xl flex items-center justify-center border border-white/5 mb-6 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
            <Sparkles className="text-cyan-400 relative z-10 animate-pulse" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Neuro Core Intelligence</h2>
          <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
            Select <strong className="text-white font-medium">"New Chat"</strong> from the sidebar to initialize your workspace telemetry pipeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-transparent text-gray-200 overflow-hidden relative">
      <ChatHeader 
        currentChatId={currentChat.id}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        onToggleSidebar={onToggleSidebar}
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
