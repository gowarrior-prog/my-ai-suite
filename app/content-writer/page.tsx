"use client";
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Sparkles, LoaderCircle, Copy, Check, FileEdit, PenTool, Menu } from 'lucide-react';

export default function ContentWriter() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState('blog post article');
  const [tone, setTone] = useState('highly professional and corporate');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSidebarOpen(window.innerWidth >= 1024);
    }
  }, []);

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateContent = async () => {
    if (!topic.trim() || loading) return;
    setLoading(true);
    setResult('');

    // System instruction copy ko neat aur bina conversational filler ke rakhti hai
    const systemInstruction = `You are a high-speed AI copywriter. Output ONLY the written copy content. Do NOT include markdown code blocks (\`\`\`). Do NOT include conversational intros like "Sure, here is your text:". Maintain a sharp, crisp format using direct spacings. Keep it concise under 350 words for maximum speed.`;
    
    // FIX LOGIC: Check karein agar user direct letter, email ya application maang raha hai
    const lowerTopic = topic.toLowerCase();
    const isDirectDraftRequest = 
      lowerTopic.includes('letter') || 
      lowerTopic.includes('email') || 
      lowerTopic.includes('write a') || 
      lowerTopic.includes('draft');

    let userPrompt = "";

    if (isDirectDraftRequest) {
      // Agar user ne letter maanga toh actual letter generate hoga
      userPrompt = `Task: Directly draft the specific communication requested by the user: "${topic}". 
      Do NOT write a blog post, article, or guide about it. Write the actual ready-to-use text/letter itself.
      Writing Voice Tone: ${tone}.
      Ensure proper professional structure (Salutation, Body, and Professional Sign-off) if it is a letter/email.`;
    } else {
      // Agar general topic hai toh standard marketing/blog layout chalega
      userPrompt = `Write a fast high-impact ${contentType}. Topic Target: "${topic}". Writing Voice Tone: ${tone}. Structure it with 1 strong catchy headline, followed directly by 3 impactful bullet points, and a 1-sentence powerful call-to-action conclusion.`;
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          historyPayload: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt }
          ] 
        }),
      });
      const data = await res.json();
      
      if (data.reply) {
        setResult(data.reply.trim());
      } else {
        setResult('AI Engine gave a blank response. Please re-try.');
      }
    } catch (err) {
      console.error("Frontend Fetch Error:", err);
      setResult('Ollama connection timeout! Check terminal console and make sure "ollama serve" is live.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#050709] text-white overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} onChatSelect={() => {}} currentChatId={null} onCreateNewChat={() => {}} />
      
      <div className="flex-1 p-4 md:p-10 overflow-y-auto max-w-5xl mx-auto space-y-6 w-full">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/5"
            aria-label="Toggle Sidebar"
          >
            <Menu size={18} />
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <PenTool size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">AI Copywriting Studio</h1>
            <p className="text-gray-400 mt-0.5 text-xs md:text-sm">Turbo-optimized prompts se instantly high-converting drafts generate karein.</p>
          </div>
        </div>

        <div className="bg-[#0A0A0A] p-6 rounded-3xl border border-white/10 space-y-5 shadow-xl">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Topic Description / Request</label>
            <input 
              type="text" 
              className="w-full bg-[#1F1F1F] border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all shadow-inner" 
              placeholder="e.g., write a formal resignation letter OR top 5 coding practices..." 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateContent()}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Content Layout Format</label>
              <select 
                className="w-full bg-[#1F1F1F] border border-white/10 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 text-white transition-all cursor-pointer" 
                value={contentType} 
                onChange={(e) => setContentType(e.target.value)}
              >
                <option value="blog post article">📰 Long-Form Blog / Article</option>
                <option value="corporate executive email">📧 Professional Email / Letter</option>
                <option value="engaging social media post">📱 Social Media Ad Copy</option>
                <option value="high-converting landing page outline">🌐 Website Hero Content</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">Writing Tone Voice</label>
              <select 
                className="w-full bg-[#1F1F1F] border border-white/10 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 text-white transition-all cursor-pointer" 
                value={tone} 
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="highly professional and corporate">👔 Strictly Professional</option>
                <option value="casual, engaging, and friendly">☕ Conversational & Friendly</option>
                <option value="creative, witty, and bold">🎨 Creative & Bold</option>
                <option value="persuasive, sales-driven, and urgent">🔥 Sales & Persuasive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              onClick={generateContent} 
              disabled={loading || !topic.trim()} 
              className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-sm font-bold rounded-2xl transition-all disabled:opacity-30 shadow-lg shadow-blue-600/10 active:scale-95"
            >
              {loading ? <LoaderCircle className="animate-spin" size={16} /> : <Sparkles size={16} />}
              Generate Pro Content
            </button>
          </div>
        </div>

        {(loading || result) && (
          <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 md:p-8 space-y-4 shadow-2xl relative overflow-hidden transition-all duration-300">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                <FileEdit size={14} /> Document Preview
              </div>
              
              {result && (
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F1F1F] border border-white/5 hover:bg-white/10 text-xs font-medium rounded-xl transition-all active:scale-95 text-gray-300 hover:text-white"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                <LoaderCircle className="animate-spin text-blue-500" size={28} />
                <span className="text-sm font-medium tracking-wide animate-pulse">Drafting your premium copy...</span>
              </div>
            ) : (
              <div className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed font-sans pr-2 max-w-none text-justify selection:bg-blue-600/30">
                {result}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
