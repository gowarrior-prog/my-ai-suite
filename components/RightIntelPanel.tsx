"use client";
import { Cpu, Sliders, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

type TelemetryData = {
  activeTools: { id: string; active: boolean; label: string }[];
  memory: { used: number; total: number; status: string };
  parameters: { temperature: string; topP: string; contextWindow: string };
  neuralTip: string;
};

export default function RightIntelPanel() {
  const [data, setData] = useState<TelemetryData | null>(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('/api/intel');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch intel data");
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

  if (!data) return (
    <div className="w-80 h-full bg-[#050709] border-l border-white/[0.04] p-6 hidden xl:flex flex-col items-center justify-center space-y-4">
      <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      <span className="text-xs text-gray-500 font-mono tracking-widest">Initializing Telemetry...</span>
    </div>
  );

  const memPercent = Math.round((data.memory.used / data.memory.total) * 100);

  return (
    <div className="w-80 h-full bg-[#050709] border-l border-white/[0.04] p-6 hidden xl:flex flex-col space-y-6 overflow-y-auto select-none custom-scroll">
      <div>
        <h3 className="text-sm font-bold text-white tracking-wide">Workspace Intel</h3>
        <p className="text-[11px] text-gray-500 mt-0.5">Real-time neural engine telemetry</p>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Active Tools</span>
        <div className="flex flex-col gap-1.5">
          {data.activeTools.map((tool) => (
            <div 
              key={tool.id} 
              className={`border px-3 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                tool.active 
                  ? 'bg-[#101917] border-emerald-500/20' 
                  : 'bg-[#0e121a] border-white/[0.04] opacity-50'
              }`}
            >
              <span className={`text-[10px] font-mono font-bold tracking-wider ${tool.active ? 'text-emerald-400' : 'text-gray-400'}`}>
                {tool.label}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${tool.active ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0A0A0A]/40 border border-white/[0.04] p-4 rounded-xl space-y-3 shadow-inner">
        <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-gray-400">
          <span className="flex items-center gap-1.5"><Cpu size={12} className="text-cyan-400" /> Memory Usage</span>
          <span className="text-cyan-400 font-mono tracking-wide">{data.memory.status}</span>
        </div>
        <div className="space-y-1">
          <div className="w-full bg-[#161920] h-2 rounded-full overflow-hidden relative">
            <div 
              className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full shadow-[0_0_8px_rgba(34,211,238,0.4)] transition-all duration-1000" 
              style={{ width: `${memPercent}%` }} 
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-gray-500 pt-0.5">
            <span>{data.memory.used.toLocaleString()} / {data.memory.total.toLocaleString()}</span>
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
            <span className="text-gray-300 font-medium transition-all">{data.parameters.temperature}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-gray-500">Top P</span>
            <span className="text-gray-300 font-medium">{data.parameters.topP}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-gray-500">Context Window</span>
            <span className="text-gray-300 font-medium">{data.parameters.contextWindow}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto border border-dashed border-white/5 bg-gradient-to-br from-purple-950/[0.08] to-transparent p-4 rounded-xl relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-purple-500/10 rounded-full blur-xl transition-all group-hover:scale-125" />
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-400 uppercase tracking-wider">
          <Zap size={12} /> Neural Tip
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
          {data.neuralTip.split("'--high-fidelity'").map((part, i, arr) => 
            i < arr.length - 1 
              ? <span key={i}>{part}<code className="text-cyan-400 bg-white/5 px-1 py-0.5 rounded font-mono">'--high-fidelity'</code></span>
              : <span key={i}>{part}</span>
          )}
        </p>
      </div>
    </div>
  );
}
