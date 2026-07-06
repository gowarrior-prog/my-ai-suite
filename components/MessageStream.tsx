"use client";
import { useEffect, useRef } from 'react';
import { LoaderCircle, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';

type AttachedFileMeta = {
  name: string;
  type: string;
  urlData: string;
};

type MessageStreamProps = {
  filteredMessages?: { 
    role: string; 
    content: string; 
    fileAttachment?: AttachedFileMeta; // Explicit support for optional file tracking links
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

  // Function to open raw encoded data directly onto browser canvas
  const handleOpenFile = (urlData: string, type: string) => {
    if (!urlData) return;
    try {
      const newWindow = window.open();
      if (newWindow) {
        // Checking for standard binary representations vs texts
        if (type.startsWith('image/')) {
          newWindow.document.write(`<img src="${urlData}" style="max-width:100%; height:auto; display:block; margin:20px auto; background:#050709;" />`);
        } else if (type === 'application/pdf') {
          newWindow.document.write(`<iframe src="${urlData}" style="width:100%; height:100vh; border:none; margin:0; padding:0;"></iframe>`);
        } else {
          // If pure base64 text document profile is generated
          const cleanText = atob(urlData.split(',')[1] || urlData);
          newWindow.document.write(`<pre style="color:#e2e8f0; background:#0f1217; padding:20px; font-family:monospace; white-space:pre-wrap;">${cleanText}</pre>`);
        }
        newWindow.document.title = "Neuro Core Workspace - File Analyzer Log";
        newWindow.document.close();
      }
    } catch (err) {
      console.error("Window compilation error:", err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 md:px-12 py-6 space-y-6 custom-scrollbar bg-transparent">
      <div className="text-center text-[10px] font-mono tracking-widest text-gray-600 uppercase select-none mb-2">Today</div>
      
      {filteredMessages.length === 0 && (
        <div className="h-[60%] flex flex-col items-center justify-center text-center select-none">
          {searchQuery ? (
            <p className="text-xs text-gray-500 italic font-mono">No matching network records found for "{searchQuery}"</p>
          ) : (
            <>
              <p className="text-5xl mb-4 animate-bounce">🦙</p>
              <h2 className="text-xl font-light tracking-wide text-white">Welcome back, Operator.</h2>
              <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
                I've initialized the system node. How can I augment your workspace layout today?
              </p>
            </>
          )}
        </div>
      )}

      {filteredMessages.map((msg, i) => (
        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200`}>
          
          {/* 📎 CLICKABLE FILE DISPLAY BADGES FOR MESSAGES AREA */}
          {msg.fileAttachment && (
            <div 
              onClick={() => msg.fileAttachment && handleOpenFile(msg.fileAttachment.urlData, msg.fileAttachment.type)}
              className="flex items-center gap-3 bg-[#0F1217] border border-white/5 hover:border-cyan-500/30 px-4 py-2.5 rounded-xl cursor-pointer shadow-lg active:scale-[0.98] transition-all group max-w-[280px]"
              title="Click to Open/View Document"
            >
              {msg.fileAttachment.type.startsWith('image/') ? (
                <ImageIcon size={16} className="text-cyan-400 group-hover:animate-pulse" />
              ) : (
                <FileText size={16} className="text-purple-400 group-hover:animate-pulse" />
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[11px] font-mono text-gray-300 truncate font-semibold">{msg.fileAttachment.name}</span>
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">{msg.fileAttachment.type.split('/')[1] || 'Document'}</span>
              </div>
              <ExternalLink size={12} className="text-gray-600 group-hover:text-cyan-400 transition-colors" />
            </div>
          )}

          {/* Core Bubble Body layout content rendering rows */}
          <div className={`max-w-[80%] px-5 py-4 rounded-2xl text-xs leading-relaxed transition-all ${
            msg.role === 'user' 
              ? 'bg-[#183984] text-white border border-blue-500/20 font-medium shadow-[0_4px_16px_rgba(24,57,132,0.15)] rounded-br-none' 
              : 'bg-[#0f1217] border border-white/[0.04] text-gray-300 rounded-bl-none shadow-md'
          }`}>
            {searchQuery.trim() ? (
              <span dangerouslySetInnerHTML={{ __html: renderHighlightedContent(msg.content) }} />
            ) : (
              msg.content
            )}
          </div>
        </div>
      ))}

      {loading && (
        <div className="flex justify-start animate-in fade-in duration-150">
          <div className="bg-[#0f1217] border border-white/[0.04] px-5 py-3 rounded-2xl rounded-bl-none flex items-center gap-3 text-xs text-gray-400 shadow-sm">
            <LoaderCircle className="animate-spin text-cyan-400" size={14} />
            <span className="font-mono tracking-wide animate-pulse">Running semantic inference...</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
