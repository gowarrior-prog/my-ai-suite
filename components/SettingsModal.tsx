"use client";
import { useEffect, useState } from 'react';
import { Palette, Lock, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateVisibilityAction, logoutAction, type Visibility } from '@/app/signup/auth';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useSettingsModal } from '@/app/contexts/SettingsModalContext';

const DARK_PRESET = { mode: 'dark' as const, accent: '#22d3ee', background: '#050709', bubbleUser: '#151a23', bubbleAssistant: '#0b0e14' };
const LIGHT_PRESET = { mode: 'light' as const, accent: '#0891b2', background: '#f4f5f7', bubbleUser: '#e5e7eb', bubbleAssistant: '#ffffff' };

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-3 py-2.5">
      <span className="text-[11px] text-gray-300 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded-lg border border-white/10 bg-transparent cursor-pointer"
        />
        <span className="text-[10px] font-mono text-gray-500 uppercase w-14">{value}</span>
      </div>
    </div>
  );
}

export default function SettingsModal() {
  const { isOpen, closeSettings } = useSettingsModal();
  const { theme, updateTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'privacy'>('profile');
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [visibilitySaving, setVisibilitySaving] = useState(false);

  // Modal khulte hi fresh user data fetch karo
  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      try {
        const res = await fetch('/api/me');
        const data = res.ok ? await res.json() : { user: null };
        if (data.user) {
          setUser({ id: data.user.id, name: data.user.name, email: data.user.email });
          setVisibility(data.user.visibility ?? 'private');
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to load user:", err);
      }
    })();
  }, [isOpen]);

  const applyPreset = (mode: 'dark' | 'light') => {
    updateTheme(mode === 'dark' ? DARK_PRESET : LIGHT_PRESET);
  };

  const handleToggleVisibility = async () => {
    const previous = visibility;
    const next: Visibility = visibility === 'public' ? 'private' : 'public';

    setVisibility(next);
    setVisibilitySaving(true);

    try {
      const res = await updateVisibilityAction(next);
      if ('error' in res) {
        console.error("Visibility save failed:", res.error);
        setVisibility(previous);
      }
    } catch (err) {
      console.error("Visibility save request failed:", err);
      setVisibility(previous);
    } finally {
      setVisibilitySaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutAction();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/login";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-[#0b0e14] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-lg font-bold text-white tracking-wide">Settings</h2>
              <button onClick={closeSettings} className="text-gray-500 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${activeTab === 'profile' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${activeTab === 'appearance' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
              >
                <Palette size={13} /> Appearance
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${activeTab === 'privacy' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
              >
                <Lock size={13} /> Privacy
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scroll">

              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-400/20 rounded-2xl flex items-center justify-center text-lg font-mono font-bold text-cyan-400">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{user?.name || "Guest User"}</h3>
                      <p className="text-xs text-gray-400">{user?.email || "Not logged in"}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium text-gray-200">Current Plan</h4>
                      <p className="text-xs text-gray-500">Neuro Core Pro</p>
                    </div>
                    <button className="text-xs font-semibold text-cyan-400 bg-cyan-400/10 px-3 py-1.5 rounded-lg border border-cyan-400/20">Manage</button>
                  </div>

                  {!user && (
                    <p className="text-[11px] text-amber-400/80 bg-amber-400/5 border border-amber-400/10 rounded-lg px-3 py-2">
                      Tum abhi login nahi ho.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mode</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => applyPreset('dark')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${theme.mode === 'dark' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
                      >
                        Dark
                      </button>
                      <button
                        onClick={() => applyPreset('light')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${theme.mode === 'light' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
                      >
                        Light
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Custom Colors</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <ColorField label="Background" value={theme.background} onChange={(v) => updateTheme({ background: v })} />
                      <ColorField label="Accent" value={theme.accent} onChange={(v) => updateTheme({ accent: v })} />
                      <ColorField label="Chat Bubble — You" value={theme.bubbleUser} onChange={(v) => updateTheme({ bubbleUser: v })} />
                      <ColorField label="Chat Bubble — AI" value={theme.bubbleAssistant} onChange={(v) => updateTheme({ bubbleAssistant: v })} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-200">Profile Visibility</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                          {visibility === 'public'
                            ? "Tumhara profile dusre users ko dikh sakta hai."
                            : "Sirf tum apna profile dekh sakte ho."}
                        </p>
                      </div>
                      <button
                        onClick={handleToggleVisibility}
                        disabled={visibilitySaving || !user}
                        className={`shrink-0 w-11 h-6 rounded-full transition-all relative disabled:opacity-40 ${visibility === 'public' ? 'bg-cyan-500' : 'bg-white/10'}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${visibility === 'public' ? 'left-[22px]' : 'left-0.5'}`} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-gray-500">
                      {visibility === 'public' ? <Eye size={12} className="text-cyan-400" /> : <EyeOff size={12} />}
                      {visibility === 'public' ? 'Public' : 'Private'}
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="px-6 py-4 border-t border-white/5 bg-[#07090c] flex justify-between">
              <button onClick={handleLogout} className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors px-3 py-2 rounded-lg hover:bg-red-400/10">
                Sign Out
              </button>
              <button onClick={closeSettings} className="text-xs font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-lg">
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}