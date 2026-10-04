import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  X,
  Send,
  Sprout as Sparkles,
  Copy,
  Check,
  RotateCcw,
  User,
  HelpCircle,
  Sprout,
  ShieldAlert,
  Droplets,
  DollarSign,
  ArrowRight,
  Database,
  RefreshCw,
} from 'lucide-react';
import { useTelemetry } from '@/src/context/telemetry-context';
import { useDiagnosis } from '@/src/context/diagnosis-context';
import { useFarms } from '@/src/context/farm-context';
import { useLanguage } from '@/src/context/language-context';
import { loadFarmRecords } from '@/src/lib/platform-sync';
import { loadCloudSimulationHistory } from '@/src/lib/simulator-sync';
import { useAuth } from '@/src/context/auth-context';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actions?: ChatAction[];
}

interface ChatAction {
  label: string;
  route: string;
  reason?: string;
}

const DEFAULT_QUICK_PROMPTS = [
  'Check pink bollworm chemical dose',
  'Best sowing window for Soybean',
  'How to file PMFBY 72h claim',
  'Drip runtime at 32°C',
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    sender: 'assistant',
    text: `**Namaste! I am AgriSence Agro AI.** 🌾\n\nI am synchronized with your live platform telemetry, weather microclimate, active pest diagnosis, and simulator store.\n\nI can assist you with:\n- **Simulator Reasoning:** Soil NPK fertigation, Tank Mix chemical compatibility, Spray SVI, and Sell vs Store WDRA profit.\n- **Pest & Disease Remediation:** Active ingredients, CIBRC safety bounds, and bio-control.\n- **Weather & Irrigation:** ETc water budgeting, Delta T evaporation, and frost mitigation.\n- **APMC Mandi Arbitrage:** Terminal rates, gross disparity spreads, and seasonal ROI.\n\nWhat can I solve for your fields today?`,
    timestamp: 'Just now',
  },
];

function getStoredSimulatorContext(userId?: string) {
  if (typeof window === 'undefined') return null;
  if (!userId) return null;
  const key = (base: string) => `${base}:${userId}`;
  try {
    const latestRun = localStorage.getItem(key('agrisence_latest_simulator_run'));
    const soilData = localStorage.getItem(key('agrisence_saved_soil_analysis'));
    const marketData = localStorage.getItem(key('agrisence_market_cache'));
    const simulationHistory = localStorage.getItem(key('agrisence_simulation_history'));
    return {
      latestRun: latestRun ? JSON.parse(latestRun) : null,
      simulationHistory: simulationHistory ? JSON.parse(simulationHistory) : [],
      soilAnalysis: soilData ? JSON.parse(soilData) : null,
      marketSnapshot: marketData ? JSON.parse(marketData) : null,
      hasStoredData: Boolean(latestRun || soilData || marketData || simulationHistory),
    };
  } catch {
    return null;
  }
}

const OFFLINE_ASSISTANT_MESSAGE = `I couldn't reach the generative AI service right now. Please try again in a moment. You can still open **AI Pest Scan** for a crop-photo diagnosis or **Outbreak Radar** for field risk signals.`;

export function AiChatDrawer({ onNavigate }: { onNavigate?: (route: string) => void }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { weatherData } = useTelemetry();
  const { activeDiagnosis, diagnosisHistory } = useDiagnosis();
  const { selectedFarm, selectedFarmId, selectedCropCycle } = useFarms();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [simContext, setSimContext] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-sync simulator data on window event
  useEffect(() => {
    setSimContext(getStoredSimulatorContext(user?.id));
  }, [user?.id]);

  useEffect(() => {
    const handleSimUpdate = () => {
      setSimContext(getStoredSimulatorContext(user?.id));
    };
    window.addEventListener('agrisence_simulator_updated', handleSimUpdate);
    window.addEventListener('storage', handleSimUpdate);
    return () => {
      window.removeEventListener('agrisence_simulator_updated', handleSimUpdate);
      window.removeEventListener('storage', handleSimUpdate);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!selectedFarmId) return;
    let cancelled = false;
    const syncCloudContext = async () => {
      const userId = selectedFarm?.userId;
      if (!userId) return;
      const [soilRows, outbreakRows, simulationRows] = await Promise.all([
        loadFarmRecords<any>('soilTests', userId, selectedFarmId, 20),
        loadFarmRecords<any>('outbreakAlerts', userId, selectedFarmId, 20),
        loadCloudSimulationHistory(userId, selectedFarmId),
      ]);
      if (cancelled) return;
      setSimContext((current: any) => ({
        ...(current || {}),
        soilAnalysis: soilRows[0] || current?.soilAnalysis || null,
        outbreakEvaluation: outbreakRows[0] || current?.outbreakEvaluation || null,
        simulationHistory: simulationRows.length ? simulationRows : (current?.simulationHistory || []),
        latestRun: simulationRows[0] || current?.latestRun || null,
        hasStoredData: Boolean(current?.hasStoredData || soilRows[0] || outbreakRows[0] || simulationRows.length),
      }));
    };
    void syncCloudContext();
    return () => { cancelled = true; };
  }, [selectedFarmId, selectedFarm?.userId]);

  const dynamicPrompts = useMemo(() => {
    const list: string[] = [];
    if (activeDiagnosis) {
      list.push(`Treatment for ${activeDiagnosis.pestName} on ${activeDiagnosis.affectedCrop}`);
    }
    if (simContext?.latestRun) {
      const r = simContext.latestRun;
      if (r.activeId === 'soil-analysis' || r.activeId === 'soil-optimization') {
        list.push(`Explain N ${r.nitrogen} P ${r.phosphorus} K ${r.potassium} fertilizer dose for ${r.targetCrop}`);
      } else if (r.activeId === 'spray-calendar') {
        list.push(`Evaluate SVI spray safety for ${r.timeHorizon || 'monthly'} horizon`);
      } else if (r.activeId === 'smart-irrigation') {
        list.push(`Review ETc ${r.referenceEt0} mm/day drip runtime`);
      } else if (r.activeId === 'expense-tracker' || r.activeId === 'cost-estimation' || r.activeId === 'farm-analytics') {
        list.push(`How to maximize my ${r.roi ? r.roi.toFixed(0) : 120}% ROI on ${r.targetCrop || 'crop'}`);
      } else if (r.activeId === 'pesticide-dosage' || r.activeId === 'spray-dosage') {
        list.push(`Verify chemical dose for ${r.sprayAcres} acres with ${r.sprayMethod}`);
      }
    }
    if (simContext?.soilAnalysis) {
      const s = simContext.soilAnalysis;
      list.push(`Gypsum / Lime recommendation for soil pH ${s.soilPh} (${s.taxonomy || 'soil'})`);
    }

    list.push(...DEFAULT_QUICK_PROMPTS);
    return Array.from(new Set(list)).slice(0, 5);
  }, [activeDiagnosis, simContext]);

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);

  useEffect(() => {
    if (!user?.id) { setMessages(INITIAL_MESSAGES); return; }
    try {
      const saved = localStorage.getItem(`agrisence_chat_history:${user.id}`);
      setMessages(saved ? JSON.parse(saved) : INITIAL_MESSAGES);
    } catch { setMessages(INITIAL_MESSAGES); }
  }, [user?.id]);

  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      localStorage.setItem(`agrisence_chat_history:${user.id}`, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages, user?.id]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setIsTyping(true);

    const controller = new AbortController();
    const requestTimeout = window.setTimeout(() => controller.abort(), 25_000);

    try {
      const currentSimCtx = getStoredSimulatorContext();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          language,
          history: updated.slice(-6),
          simulatorContext: currentSimCtx,
          weatherData,
          activeDiagnosis,
          diagnosisHistory: diagnosisHistory.slice(0, 25),
          farmContext: selectedFarm,
          farmId: selectedFarmId,
          cropCycle: selectedCropCycle,
          currentRoute: window.location.pathname,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.reply) {
        throw new Error(data.error || 'AI service is temporarily unavailable.');
      }

      const actions: ChatAction[] = Array.isArray(data.actions)
        ? (data.actions as unknown[])
          .filter((action: unknown): action is Record<string, unknown> => Boolean(action && typeof action === 'object'))
          .map((action: Record<string, unknown>) => ({
            label: String(action.label || '').trim(),
            route: String(action.route || '').trim(),
            reason: String(action.reason || '').trim(),
          }))
          .filter((action: ChatAction) => action.label && action.route)
          .slice(0, 3)
        : [];

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      // Do not substitute canned agronomy answers for the generative model.
      // Show an honest service notice when Gemini is unavailable.
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        sender: 'assistant',
        text: OFFLINE_ASSISTANT_MESSAGE,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      window.clearTimeout(requestTimeout);
      setIsTyping(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      // Clipboard access can be unavailable on insecure origins or in an iframe.
      setCopiedId(null);
    });
  };

  const handleClear = () => {
    setMessages(INITIAL_MESSAGES);
    if (user?.id) localStorage.removeItem(`agrisence_chat_history:${user.id}`);
  };

  const handleAction = (action: ChatAction) => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(action.route);
      return;
    }

    if (action.route.startsWith('/')) {
      window.history.pushState({}, '', action.route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // Simple Markdown renderer for lists, bold, and headers
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs sm:text-[13px] leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-black text-slate-900 dark:text-white pt-1 text-sm text-[var(--brand-text,#0d7342)]">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-2">
                <span className="text-[var(--brand-color,#0f9a58)] font-bold shrink-0">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(line.substring(2)) }} />
              </div>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-2">
                <span className="text-[var(--brand-color,#0f9a58)] font-black shrink-0">
                  {line.match(/^\d+\./)?.[0]}
                </span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^\d+\.\s/, '')) }} />
              </div>
            );
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }
          return <p key={idx} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
        })}
      </div>
    );
  };

  const formatInline = (str: string) => {
    // AI output is external input. Escape it before adding the small set of
    // formatting tags supported by this lightweight Markdown renderer.
    const escaped = str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    return escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-xs">$1</code>');
  };

  return (
    <>
      {/* Floating Action Button (FAB) at Bottom-Right */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Open Agro AI Chatbot"
          className="relative size-14 rounded-full bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white flex items-center justify-center shadow-[0_12px_32px_rgba(15,154,88,0.4)] cursor-pointer transition-colors"
        >
          {isOpen ? <X className="size-6" /> : <Bot className="size-7 stroke-[2.2]" />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex size-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-3.5 bg-amber-400 border-2 border-white" />
            </span>
          )}
        </motion.button>
      </div>

      {/* Slide-out / Popover Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-4 sm:right-6 z-40 w-[94vw] sm:w-[420px] max-h-[82vh] h-[640px] rounded-[32px] frosted-card border border-white/85 dark:border-white/14 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_65px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-slate-950 dark:text-slate-100"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-2xl bg-[var(--brand-color,#0f9a58)] text-white flex items-center justify-center shadow-2xs">
                  <Bot className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>AgriSence Agro AI</span>
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                    <Database className="size-3 text-emerald-600" />
                    <span>Synced with Simulators & Telemetry</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleClear}
                  title="Clear conversation"
                  className="p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                >
                  <RotateCcw className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Quick Prompt Suggestions Ribbon */}
            <div className="p-2 border-b border-slate-200/40 dark:border-white/5 overflow-x-auto whitespace-nowrap flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-900/20">
              {dynamicPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold frosted-glass-sub border border-emerald-500/30 text-slate-800 dark:text-slate-100 hover:bg-[var(--brand-color,#0f9a58)] hover:text-white transition-all shrink-0 cursor-pointer shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
              {messages.map((msg, idx) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={`${msg.id}-${idx}`}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`relative group max-w-[88%] rounded-2xl p-3.5 ${
                        isUser
                          ? 'bg-[var(--brand-color,#0f9a58)] text-white rounded-br-none shadow-md shadow-emerald-600/15'
                          : 'frosted-glass-sub border border-white/80 dark:border-white/10 rounded-bl-none text-slate-900 dark:text-slate-100 shadow-2xs'
                      }`}
                    >
                       {renderFormattedText(msg.text)}

                       {!isUser && msg.actions && msg.actions.length > 0 && (
                         <div className="mt-3 space-y-1.5 border-t border-emerald-500/20 pt-2.5">
                           {msg.actions.map((action) => (
                             <button
                               key={`${msg.id}-${action.route}-${action.label}`}
                               type="button"
                               onClick={() => handleAction(action)}
                               className="w-full rounded-xl bg-[var(--brand-subtle,#f0faf4)] px-2.5 py-2 text-left text-[11px] font-black text-[var(--brand-text,#0d7342)] transition-colors hover:bg-emerald-500/20"
                             >
                               <span className="flex items-center gap-1.5">
                                 <ArrowRight className="size-3.5 shrink-0" />
                                 <span>{action.label}</span>
                               </span>
                               {action.reason && <span className="mt-0.5 block pl-5 text-[10px] font-semibold text-slate-500">{action.reason}</span>}
                             </button>
                           ))}
                         </div>
                       )}

                      {/* Copy Action for Assistant Messages */}
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.text)}
                          title="Copy text"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-white/80 dark:bg-slate-800 text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <Check className="size-3 text-emerald-600" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      )}
                    </div>
                    <span className="text-[9px] font-semibold text-slate-400 mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}

              {/* Typing Animation Indicator */}
              {isTyping && (
                <div className="flex items-center gap-1.5 p-3 rounded-2xl frosted-glass-sub border border-white/70 max-w-[120px]">
                  <span className="size-1.5 rounded-full bg-[var(--brand-color,#0f9a58)] animate-bounce" />
                  <span className="size-1.5 rounded-full bg-[var(--brand-color,#0f9a58)] animate-bounce [animation-delay:0.2s]" />
                  <span className="size-1.5 rounded-full bg-[var(--brand-color,#0f9a58)] animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Box */}
            <div className="p-3 border-t border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-slate-900/50">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about chemicals, sowing, APMC, or PMFBY..."
                  className="flex-1 px-3.5 py-2.5 rounded-2xl frosted-glass-sub border border-white/80 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#0f9a58)] shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="size-10 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white flex items-center justify-center shadow-md shadow-emerald-600/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer shrink-0"
                >
                  <Send className="size-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
