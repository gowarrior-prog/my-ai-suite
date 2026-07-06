"use client";
import { Plus, MessageSquare, Trash2, ChevronLeft, Settings, Bot, PenTool, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Chat = {
  id: string;
  title: string;
  messages: { role: string; content: string }[];
  timestamp: string;
};

type SidebarProps = {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  onChatSelect: (chat: Chat | null) => void;
  currentChatId: string | null;
  onCreateNewChat: () => void;
};

export default function Sidebar({ isOpen, setIsOpen, onChatSelect, currentChatId, onCreateNewChat }: SidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    const loadChats = () => {
      const saved = localStorage.getItem('neuro-chats');
      if (saved) setChats(JSON.parse(saved));
    };
    loadChats();
    const interval = setInterval(loadChats, 1000);
    return () => clearInterval(interval);
  }, []);

  const deleteChat = (id: string) => {
    const filtered = chats.filter(c => c.id !== id);
    setChats(filtered);
    localStorage.setItem('neuro-chats', JSON.stringify(filtered));
    if (currentChatId === id) {
      // FIXED: Passed filtered[0] object instead of the raw array structure
      onChatSelect(filtered.length > 0 ? filtered[0] : null);
    }
  };

  return (
    <div className={`${isOpen ? 'w-64' : 'w-20'} bg-[#050709] h-screen border-r border-white/[0.03] flex flex-col transition-all duration-300 ease-in-out select-none z-20`}>
      <div className="h-14 p-4 flex items-center justify-between border-b border-white/[0.03] bg-[#050709]">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-cyan-400 rounded-md flex items-center justify-center shadow-[0_0_8px_rgba(34,211,238,0.4)]">
              <Bot size={12} className="text-[#050709]" />
            </div>
            <span className="font-black text-sm tracking-wider text-white">MY-AI-SUITE</span>
          </div>
        )}
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-white transition-colors mx-auto md:mx-0">
          <ChevronLeft size={16} className={!isOpen ? "rotate-180" : ""} />
        </button>
      </div>

      <div className="p-3 space-y-1">
        {isOpen && <p className="text-[9px] font-bold tracking-widest text-gray-600 px-3 mb-2 uppercase">AI Tools</p>}
        
        <Link href="/" className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all text-xs ${pathname === '/' ? 'bg-[#151b26] text-cyan-400 border border-cyan-500/10 font-bold shadow-[0_4px_12px_rgba(0,0,0,0.2)]' : 'text-gray-500 hover:bg-white/[0.02] hover:text-gray-300'}`}>
          <Bot size={16} />
          {isOpen && <span>Neuro Core</span>}
        </Link>

        <Link href="/content-writer" className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all text-xs ${pathname === '/content-writer' ? 'bg-[#151b26] text-cyan-400 border border-cyan-500/10 font-bold' : 'text-gray-500 hover:bg-white/[0.02] hover:text-gray-300'}`}>
          <PenTool size={16} />
          {isOpen && <span>Copywriting Studio</span>}
        </Link>

        <Link href="/resume-builder" className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all text-xs ${pathname === '/resume-builder' ? 'bg-[#151b26] text-cyan-400 border border-cyan-500/10 font-bold' : 'text-gray-500 hover:bg-white/[0.02] hover:text-gray-300'}`}>
          <FileText size={16} />
          {isOpen && <span>Resume Studio Pro</span>}
        </Link>
      </div>

      {pathname === '/' && (
        <div className="px-3 py-1">
          <button onClick={onCreateNewChat} className="flex items-center gap-3 w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] text-gray-300 transition-all font-semibold text-xs justify-center md:justify-start">
            <Plus size={16} />
            {isOpen && <span>New Chat</span>}
          </button>
        </div>
      )}

      {isOpen && pathname === '/' && (
        <div className="flex-1 overflow-y-auto px-3 space-y-0.5 py-3 custom-scrollbar border-t border-white/[0.02] mt-2">
          <p className="text-[9px] font-bold tracking-widest text-gray-600 px-3 mb-2 uppercase">Recent History</p>
          {chats.length === 0 && <p className="text-gray-600 text-[11px] px-3 py-2 italic">No context logs</p>}
          {chats.map(chat => (
            <div key={chat.id} onClick={() => onChatSelect(chat)} className={`px-3 py-2 rounded-xl hover:bg-white/[0.02] cursor-pointer flex justify-between items-center group transition-all ${currentChatId === chat.id ? 'bg-white/[0.04] text-white font-medium' : 'text-gray-500 hover:text-gray-300'}`}>
              <div className="flex items-center gap-2.5 truncate flex-1 pr-2">
                <MessageSquare size={13} className={currentChatId === chat.id ? 'text-cyan-400' : 'text-gray-600'} />
                <span className="truncate text-xs font-mono">{chat.title}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded-md text-gray-600 hover:text-red-400 transition-all">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 border-t border-white/[0.03] bg-[#050709] mt-auto">
        <div className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-white/[0.02] transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-7 h-7 bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-400/20 rounded-lg flex items-center justify-center text-xs font-mono font-bold text-cyan-400">
              AR
            </div>
            {isOpen && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-gray-200 truncate group-hover:text-white transition-colors">Alex Rivers</span>
                <span className="text-[9px] font-bold text-cyan-400 tracking-wider font-mono">Pro Plan</span>
              </div>
            )}
          </div>
          {isOpen && <Settings size={14} className="text-gray-500 group-hover:text-gray-300 transition-colors" />}
        </div>
      </div>
    </div>
  );
}
