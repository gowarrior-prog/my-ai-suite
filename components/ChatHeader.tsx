"use client";
import { useState } from 'react';
import { Search, Share2, User, LogOut, X } from 'lucide-react';

type ChatHeaderProps = {
  currentChatId: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
};

export default function ChatHeader({
  currentChatId,
  searchQuery,
  setSearchQuery,
  searchOpen,
  setSearchOpen,
}: ChatHeaderProps) {
  const [shareCopied, setShareCopied] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleShareChat = async () => {
    try {
      const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
      await navigator.clipboard.writeText(`${currentUrl}?chatId=${currentChatId || ''}`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-14 border-b border-white/[0.03] flex items-center justify-between px-6 bg-[#050709]/80 backdrop-blur-md z-30 relative select-none">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <h1 className="font-bold text-sm tracking-wide text-white uppercase">NEURO</h1>
        <div className="bg-[#0e1619] border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-emerald-400" />
          <span className="text-[9px] font-mono font-bold text-emerald-400 tracking-wider">Neural Engine v4.2</span>
        </div>
      </div>

      {/* Search Bar */}
      {searchOpen && (
        <div className="absolute left-36 right-48 h-9 bg-[#11151d] border border-white/5 rounded-xl flex items-center px-3 gap-2">
          <Search size={14} className="text-gray-500" />
          <input 
            type="text"
            className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
            placeholder="Search chat history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <button 
            onClick={() => { setSearchOpen(false); setSearchQuery(''); }} 
            className="text-gray-500 hover:text-white p-0.5"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 text-gray-400">
        <button 
          onClick={() => setSearchOpen(!searchOpen)} 
          className={`hover:text-white transition-colors p-1.5 rounded-lg ${searchOpen ? 'text-cyan-400 bg-white/5' : ''}`}
        >
          <Search size={16} />
        </button>

        <button 
          onClick={handleShareChat} 
          className={`hover:text-white transition-colors p-1.5 rounded-lg relative ${shareCopied ? 'text-emerald-400' : ''}`}
        >
          <Share2 size={16} />
          {shareCopied && (
            <div className="absolute right-0 top-9 bg-emerald-600 text-white text-[10px] px-2 py-1 rounded-md font-semibold tracking-wide whitespace-nowrap shadow-lg animate-bounce">
              Link Copied!
            </div>
          )}
        </button>

        <div className="relative">
          <button 
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="w-7 h-7 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full text-[10px] font-mono font-bold text-white flex items-center justify-center cursor-pointer shadow-md transition-all"
          >
            AN
          </button>

          {profileMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-[#0F1217] border border-white/5 rounded-2xl p-2 shadow-2xl z-50">
                <div className="px-3 py-2 border-b border-white/[0.03] text-left">
                  <p className="text-xs font-bold text-white">Alex Rivers</p>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">alex@neuro-suite.io</p>
                </div>
                <button onClick={() => { alert('Account Settings'); setProfileMenuOpen(false); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/[0.02] rounded-xl transition-all mt-1">
                  <User size={13} className="text-cyan-400" /> Account Settings
                </button>
                <button onClick={() => { alert('Signed Out'); setProfileMenuOpen(false); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}