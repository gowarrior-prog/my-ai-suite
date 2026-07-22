"use client";
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { LoaderCircle, Sparkles, Printer, Wand2, Terminal, Menu } from 'lucide-react';

export default function ResumeBuilder() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [expLoading, setExpLoading] = useState(false);
  const [customLoading, setCustomLoading] = useState(false);
  const [customCommand, setCustomCommand] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSidebarOpen(window.innerWidth >= 1024);
    }
  }, []);

  // Resume data with guaranteed defaults
  const [resumeData, setResumeData] = useState({
    fullName: 'John Doe',
    jobTitle: 'Full Stack Developer',
    email: 'john@example.com',
    skills: 'React, Node.js, Next.js, Python',
    experience: 'Google - Software Engineer (2023)\nDeveloped scale applications and managed microservices.',
    education: 'B.S. CS - University of Engineering (2024)',
    aiSummary: 'Results-driven Full Stack Developer with expertise in React, Node.js, and cloud architectures.'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setResumeData(prev => ({ ...prev, [name]: value }));
  };

  // Safe AI update - always preserve all fields
  const updateResumeData = (newData: Partial<typeof resumeData>) => {
    setResumeData(prev => ({
      fullName: newData.fullName ?? prev.fullName ?? '',
      jobTitle: newData.jobTitle ?? prev.jobTitle ?? '',
      email: newData.email ?? prev.email ?? '',
      skills: newData.skills ?? prev.skills ?? '',
      experience: newData.experience ?? prev.experience ?? '',
      education: newData.education ?? prev.education ?? '',
      aiSummary: newData.aiSummary ?? prev.aiSummary ?? '',
    }));
  };

  const handleCustomAICommand = async () => {
    if (!customCommand.trim() || customLoading) return;
    setCustomLoading(true);

    const systemPrompt = `You are an expert AI Resume Editor. You must output a valid JSON object ONLY. 
    Do not reply with any markdown, explanations, or extra text.
    Current Resume Data: ${JSON.stringify(resumeData)}
    Expected output structure must match this JSON format exactly:
    { "fullName": "...", "jobTitle": "...", "email": "...", "skills": "...", "experience": "...", "education": "...", "aiSummary": "..." }`;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          historyPayload: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `User Custom Command: ${customCommand}` }
          ]
        }),
      });

      const data = await res.json();
      if (data.reply) {
        let jsonString = data.reply.trim()
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();

        const jsonStart = jsonString.indexOf('{');
        const jsonEnd = jsonString.lastIndexOf('}');

        if (jsonStart !== -1 && jsonEnd !== -1) {
          jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
          const parsed = JSON.parse(jsonString);
          updateResumeData(parsed);
          setCustomCommand('');
        } else {
          alert("AI ne sahi JSON structure return nahi kiya. Dubara try karein.");
        }
      }
    } catch (err) {
      console.error(err);
      alert('AI command failed. Check Ollama connection.');
    } finally {
      setCustomLoading(false);
    }
  };

  const generateAISummary = async () => {
    if (!resumeData.jobTitle || !resumeData.skills || summaryLoading) return;
    setSummaryLoading(true);
    const systemInstruction = "You are an expert resume writer. Output ONLY the executive summary text. No fillers, no quotes.";

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historyPayload: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: `Write a professional 3-sentence summary. Role: ${resumeData.jobTitle}, Skills: ${resumeData.skills}.` }
          ]
        })
      });
      const data = await res.json();
      if (data.reply) {
        updateResumeData({ aiSummary: data.reply.trim().replace(/^["']|["']$/g, '') });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const enhanceWorkExperience = async () => {
    if (!resumeData.experience || expLoading) return;
    setExpLoading(true);
    const systemInstruction = "You are an ATS engine. Output ONLY professional bullet points using action verbs. No conversational text.";

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historyPayload: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: `Convert this to 3 resume bullets: ${resumeData.experience}` }
          ]
        })
      });
      const data = await res.json();
      if (data.reply) {
        updateResumeData({ experience: data.reply.trim() });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExpLoading(false);
    }
  };

  const handlePrint = () => { window.print(); };

  return (
    <div className="flex h-screen bg-[#050709] text-white overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} onChatSelect={() => {}} currentChatId={null} onCreateNewChat={() => {}} />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 print:p-0 print:bg-white print:text-black w-full">
        
        {/* LEFT CONTROL BOARD */}
        <div className="lg:col-span-5 space-y-4 print:hidden w-full">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/5"
              aria-label="Toggle Sidebar"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">AI Resume Studio Pro</h1>
              <p className="text-xs text-gray-400 mt-0.5">Llama 3.2 local custom intelligence terminal live.</p>
            </div>
          </div>

          {/* Custom AI Prompter */}
          <div className="bg-gradient-to-br from-purple-900/20 via-[#0A0A0A] to-[#0A0A0A] p-4 rounded-2xl border border-purple-500/10 shadow-xl space-y-2">
            <div className="flex items-center gap-2 text-purple-400 text-[10px] font-bold tracking-wider uppercase">
              <Terminal size={12} /> Custom AI Prompter / Editor
            </div>
            <div className="relative">
              <input 
                type="text" 
                className="w-full bg-[#1F1F1F] border border-white/5 rounded-xl pl-3 pr-10 py-2.5 text-xs text-purple-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all font-mono"
                placeholder="e.g., Change name to Elon Musk..."
                value={customCommand}
                onChange={(e) => setCustomCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomAICommand()}
              />
              <button 
                onClick={handleCustomAICommand}
                disabled={customLoading || !customCommand.trim()}
                className="absolute right-1.5 top-1.5 p-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 rounded-lg transition-all text-white shadow-md"
              >
                {customLoading ? <LoaderCircle className="animate-spin" size={12} /> : <Sparkles size={12} />}
              </button>
            </div>
          </div>

          {/* DYNAMIC FORMS */}
          <div className="bg-[#0A0A0A] p-4 rounded-2xl border border-white/5 space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Full Name</label>
                <input 
                  type="text" 
                  name="fullName" 
                  className="w-full bg-[#1F1F1F] border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-all" 
                  value={resumeData.fullName} 
                  onChange={handleInputChange} 
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Target Job Title</label>
                <input 
                  type="text" 
                  name="jobTitle" 
                  className="w-full bg-[#1F1F1F] border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-all" 
                  value={resumeData.jobTitle} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Email Address</label>
              <input 
                type="email" 
                name="email" 
                className="w-full bg-[#1F1F1F] border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-all" 
                value={resumeData.email} 
                onChange={handleInputChange} 
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Skills (Comma Separated)</label>
              <input 
                type="text" 
                name="skills" 
                className="w-full bg-[#1F1F1F] border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-all" 
                value={resumeData.skills} 
                onChange={handleInputChange} 
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase block">Work Experience</label>
                <button 
                  onClick={enhanceWorkExperience} 
                  disabled={expLoading || !resumeData.experience} 
                  className="text-[9px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold tracking-wider uppercase transition-all disabled:opacity-30"
                >
                  {expLoading ? <LoaderCircle className="animate-spin" size={10} /> : <Wand2 size={10} />}
                  AI Bullet Optimizer
                </button>
              </div>
              <textarea 
                name="experience" 
                rows={4} 
                className="w-full bg-[#1F1F1F] border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 resize-none font-mono text-[11px]" 
                value={resumeData.experience} 
                onChange={handleInputChange} 
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Education</label>
              <input 
                type="text" 
                name="education" 
                className="w-full bg-[#1F1F1F] border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-all" 
                value={resumeData.education} 
                onChange={handleInputChange} 
              />
            </div>

            <div className="flex gap-2.5 justify-end pt-1">
              <button 
                onClick={generateAISummary} 
                disabled={summaryLoading || !resumeData.jobTitle || !resumeData.skills} 
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-[11px] font-semibold rounded-lg transition-all disabled:opacity-40"
              >
                {summaryLoading ? <LoaderCircle className="animate-spin" size={12} /> : <Sparkles size={12} />}
                AI Summary
              </button>
              <button 
                onClick={handlePrint} 
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-[11px] font-semibold rounded-lg transition-all"
              >
                <Printer size={12} />
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* ==================== FIXED PRINT PREVIEW ==================== */}
        <div 
          className="lg:col-span-7 bg-white text-black p-8 shadow-xl flex flex-col min-h-[800px] max-w-[210mm] mx-auto w-full 
                     print:border-none print:shadow-none print:rounded-none print:p-8 print:min-h-0 print:h-auto 
                     overflow-visible border border-gray-100 rounded-2xl"
          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        >
          {/* Header */}
          <div className="text-center border-b-2 border-gray-900 pb-6">
            <h2 className="text-3xl font-black tracking-tight uppercase text-gray-900">
              {resumeData.fullName || "YOUR FULL NAME"}
            </h2>
            <p className="text-blue-700 font-bold text-sm tracking-widest mt-1 uppercase">
              {resumeData.jobTitle || "PROFESSIONAL JOB ARCHITECT"}
            </p>
            <div className="flex justify-center items-center gap-3 text-gray-600 text-sm mt-3">
              <span>{resumeData.email || "hello@yourdomain.com"}</span>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6">
            <h3 className="text-xs font-bold tracking-widest text-gray-900 uppercase border-b border-gray-300 pb-1 mb-2">
              SUMMARY PROFILE
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {resumeData.aiSummary || "AI Summary generate karein..."}
            </p>
          </div>

          {/* Experience */}
          <div className="mt-7">
            <h3 className="text-xs font-bold tracking-widest text-gray-900 uppercase border-b border-gray-300 pb-1 mb-2">
              PROFESSIONAL EXPERIENCE
            </h3>
            <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {resumeData.experience || "Work experience yahan aayega..."}
            </div>
          </div>

          {/* Skills */}
          <div className="mt-7">
            <h3 className="text-xs font-bold tracking-widest text-gray-900 uppercase border-b border-gray-300 pb-1 mb-2">
              TECHNICAL COMPETENCIES
            </h3>
            <div className="flex flex-wrap gap-2">
              {resumeData.skills ? 
                resumeData.skills.split(',').map((skill, i) => (
                  <span key={i} className="bg-gray-100 text-gray-800 text-xs font-medium px-3 py-1 rounded border border-gray-300">
                    {skill.trim().toUpperCase()}
                  </span>
                )) 
                : <span className="text-gray-400">No skills added</span>
              }
            </div>
          </div>

          {/* Education */}
          <div className="mt-7">
            <h3 className="text-xs font-bold tracking-widest text-gray-900 uppercase border-b border-gray-300 pb-1 mb-2">
              EDUCATION
            </h3>
            <p className="text-sm text-gray-700 font-medium">
              {resumeData.education || "Education details yahan aayenge..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}