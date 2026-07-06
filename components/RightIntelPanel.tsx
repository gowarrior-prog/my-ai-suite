"use client";
import { Cpu, Sliders, Zap } from 'lucide-react';

export default function RightIntelPanel() {
  return (
    <div className="w-80 h-full bg-[#050709] border-l border-white/[0.04] p-6 hidden xl:flex flex-col space-y-6 overflow-y-auto select-none">
      <div>
        <h3 className="text-sm font-bold text-white tracking-wide">Workspace Intel</h3>
        <p className="text-[11px] text-gray-500 mt-0.5">Real-time neural engine telemetry</p>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Active Tools</span>
        <div className="flex flex-col gap-1.5">
          <div className="bg-[#101917] border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider">IMAGE_GEN_V3</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="bg-[#101917] border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider">CODE_INTERPRETER</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="bg-[#0e121a] border border-white/[0.04] px-3 py-1.5 rounded-lg flex items-center justify-between opacity-50">
            <span className="text-[10px] font-mono font-bold text-gray-400 tracking-wider">WEB_SEARCH</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
          </div>
        </div>
      </div>

      <div className="bg-[#0A0A0A]/40 border border-white/[0.04] p-4 rounded-xl space-y-3 shadow-inner">
        <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-gray-400">
          <span className="flex items-center gap-1.5"><Cpu size={12} className="text-cyan-400" /> Memory Usage</span>
          <span className="text-cyan-400 font-mono tracking-wide">Optimum</span>
        </div>
        <div className="space-y-1">
          <div className="w-full bg-[#161920] h-2 rounded-full overflow-hidden relative">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full w-[42%] rounded-full shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-gray-500 pt-0.5">
            <span>8,400 / 2,000</span>
            <span>CTX_MAX</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <Sliders size={12} className="text-purple-400" /> Model Parameters
        </span>
        <div className="space-y-2 bg-[#0A0A0A]/20 border border-white/[0.02] p-3 rounded-xl font-mono text-[11px]">
          <div className="flex justify-between py-0.5">
            <span className="text-gray-500">Temperature</span>
            <span className="text-gray-300 font-medium">0.72</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-gray-500">Top P</span>
            <span className="text-gray-300 font-medium">0.90</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-gray-500">Context Window</span>
            <span className="text-gray-300 font-medium">128k</span>
          </div>
        </div>
      </div>

      <div className="mt-auto border border-dashed border-white/5 bg-gradient-to-br from-purple-950/[0.08] to-transparent p-4 rounded-xl relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-purple-500/10 rounded-full blur-xl transition-all group-hover:scale-125" />
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-400 uppercase tracking-wider">
          <Zap size={12} /> Neural Tip
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
          Try adding <code className="text-cyan-400 bg-white/5 px-1 py-0.5 rounded font-mono">"--high-fidelity"</code> to your creative prompts to activate specialized rendering layers.
        </p>
      </div>
    </div>
  );
}
