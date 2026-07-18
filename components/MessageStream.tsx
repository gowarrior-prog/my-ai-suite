"use client";
import { useEffect, useRef } from 'react';
import { LoaderCircle, FileText, Image as ImageIcon, ExternalLink, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

type AttachedFileMeta = {
  name: string;
  type: string;
  urlData: string;
};

type MessageStreamProps = {
  filteredMessages?: { 
    role: string; 
    content: string; 
    fileAttachment?: AttachedFileMeta;
  }[];
  searchQuery: string;
  loading: boolean;
};

export default function MessageStream({ 
  filteredMessages = [], 
  searchQuery = '', 
  loading 
}: MessageStreamProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages?.length, loading]);

  const renderHighlightedContent = (content: string) => {
    if (!searchQuery.trim()) return content;
    try {
      const escapedQuery = searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      return content.replace(
        regex, 
        '<mark class="bg-cyan-400/20 text-cyan-300 border-b border-cyan-400/60 font-semibold px-0.5">$1</mark>'
      );
    } catch (e) {
      return content;
    }
  };

  const handleOpenFile = (urlData: string, type: string) => {
    if (!urlData) return;
    try {
      const newWindow = window.open();
      if (newWindow) {
        if (type.startsWith('image/')) {
          newWindow.document.write(`<img src="${urlData}" style="max-width:100%; height:auto; display:block; margin:20px auto; background:#050709;" />`);
        } else if (type === 'application/pdf') {
          newWindow.document.write(`<iframe src="${urlData}" style="width:100%; height:100vh; border:none; margin:0; padding:0;"></iframe>`);
        } else {
          const cleanText = atob(urlData.split(',')[1] || urlData);
          newWindow.document.write(`<pre style="color:#e2e8f0; background:#0f1217; padding:20px; font-family:monospace; white-space:pre-wrap;">${cleanText}</pre>`);
        }
        newWindow.document.title = "Workspace - File Analyzer";
        newWindow.document.close();
      }
    } catch (err) {
      console.error("Window compilation error:", err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-12 py-6 space-y-8 custom-scroll bg-transparent">
      {filteredMessages.length > 0 && (
        <div className="text-center text-[10px] font-mono tracking-widest text-gray-500 uppercase select-none mb-4">
          Today
        </div>
      )}
      
      {filteredMessages.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="h-full flex flex-col items-center justify-center text-center select-none pt-20"
        >
          {searchQuery ? (
            <p className="text-sm text-gray-500 italic font-mono">No matching records found for "{searchQuery}"</p>
          ) : (
            <>
              <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center border border-white/5 mb-6 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
                <Sparkles className="text-cyan-400 relative z-10 animate-pulse" size={32} />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-white mb-2">How can I help you today?</h2>
              <p className="text-sm text-gray-400 max-w-md leading-relaxed px-4">
                Upload a PDF, image, or text document and ask me to analyze it. You can also just say hello!
              </p>
            </>
          )}
        </motion.div>
      )}

      {filteredMessages.map((msg, i) => (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          key={i} 
          className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}
        >
          {msg.fileAttachment && (
            <div 
              onClick={() => msg.fileAttachment && handleOpenFile(msg.fileAttachment.urlData, msg.fileAttachment.type)}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 px-4 py-3 rounded-2xl cursor-pointer shadow-lg active:scale-95 transition-all group max-w-[280px] backdrop-blur-md"
              title="Click to Open/View Document"
            >
              <div className="bg-black/30 p-2 rounded-xl group-hover:scale-110 transition-transform">
                {msg.fileAttachment.type.startsWith('image/') ? (
                  <ImageIcon size={18} className="text-cyan-400" />
                ) : (
                  <FileText size={18} className="text-indigo-400" />
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs text-gray-200 truncate font-medium">{msg.fileAttachment.name}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">{msg.fileAttachment.type.split('/')[1] || 'Document'}</span>
              </div>
              <ExternalLink size={14} className="text-gray-600 group-hover:text-white transition-colors" />
            </div>
          )}

          {/*
            Fix: chat bubble ka background ab hardcoded Tailwind gradient/transparent
            nahi hai — CSS variable (--bubble-user / --bubble-assistant) se aata hai,
            jo ThemeContext user ke saved preference ke hisaab se set karta hai.
            Isse Settings > Appearance tab se user apne chat bubbles ka color
            khud choose kar sakta hai, aur wo turant yahan reflect ho jaata hai.
          */}
          <div 
            className={`max-w-[85%] md:max-w-[75%] px-5 py-3.5 rounded-[24px] text-sm leading-relaxed transition-all shadow-md border border-white/[0.06] ${
              msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'
            }`}
            style={{
              backgroundColor: msg.role === 'user' ? 'var(--bubble-user)' : 'var(--bubble-assistant)',
              color: 'var(--app-foreground)',
            }}
          >
            {searchQuery.trim() ? (
              <span dangerouslySetInnerHTML={{ __html: renderHighlightedContent(msg.content) }} />
            ) : (
              <div className="whitespace-pre-wrap">{msg.content}</div>
            )}
          </div>
        </motion.div>
      ))}

      {loading && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start"
        >
          <div className="bg-transparent px-5 py-4 flex items-center gap-3 text-sm text-gray-400">
            <LoaderCircle className="animate-spin" style={{ color: 'var(--app-accent)' }} size={18} />
            <span className="animate-pulse font-medium">Thinking...</span>
          </div>
        </motion.div>
      )}

      <div ref={messagesEndRef} className="h-4" />
    </div>
  );
}