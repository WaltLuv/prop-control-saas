
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Mic, MicOff, Zap, X, Volume2, PhoneOff,
  Loader2, BrainCircuit, Activity, RefreshCw, AlertCircle, ShieldCheck,
  Cpu, Radio, Power
} from 'lucide-react';
import { Job, Asset, Tenant, JobStatus, Contractor, AppTab, KPIEntry, PlanTier } from '../types';
import { GoogleGenAI, Modality } from '@google/genai';
import { decode, decodeAudioData, createPcmBlob, ensureAudioContext } from '../audioUtils';
import * as Tools from '../geminiService';

interface AlexVoiceTerminalProps {
  tenants: Tenant[];
  assets: Asset[];
  contractors: Contractor[];
  jobs: Job[];
  onNavigate: (tab: AppTab) => void;
  onUpdateAssets: (assets: React.SetStateAction<Asset[]>) => void;
  onUpdateTenants: (tenants: React.SetStateAction<Tenant[]>) => void;
  onUpdateContractors: (contractors: React.SetStateAction<Contractor[]>) => void;
  onUpdateJobs: (jobs: React.SetStateAction<Job[]>) => void;
  onAddKPI: (kpi: Omit<KPIEntry, 'id'>) => void;
  onTriggerSpecializedCall: (jobId: string, type: 'DISPATCH' | 'NOTIFY') => void;
  onClose: () => void;
  isInline?: boolean;
  plan: PlanTier;
}

const AlexVoiceTerminal: React.FC<AlexVoiceTerminalProps> = ({
  tenants, assets, contractors, jobs,
  onNavigate, onUpdateAssets, onUpdateTenants, onUpdateContractors, onUpdateJobs, onAddKPI,
  onTriggerSpecializedCall, onClose, isInline = false, plan
}) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'disconnected' | 'error'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [transcripts, setTranscripts] = useState<{ sender: string; text: string }[]>([]);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef(false);

  useEffect(() => {
    return () => {
      isClosingRef.current = true;
      terminateNeuralLink();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [transcripts]);

  const startNeuralLink = async () => {
    try {
      setStatus('connecting');
      isClosingRef.current = false;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        console.error("Missing VITE_GEMINI_API_KEY");
        setStatus('error');
        return;
      }
      const ai = new GoogleGenAI({ apiKey });

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      await ensureAudioContext(inputAudioContextRef.current);
      await ensureAudioContext(outputAudioContextRef.current);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const callbacks = {
        onopen: () => {
          if (isClosingRef.current) return;
          setStatus('active');

          const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
          const processor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);

          processor.onaudioprocess = (e: AudioProcessingEvent) => {
            if (isMuted || isClosingRef.current) return;
            const pcmBlob = createPcmBlob(e.inputBuffer.getChannelData(0));
            sessionPromiseRef.current?.then((session) => {
              if (session) {
                session.sendRealtimeInput({ media: pcmBlob });
              }
            });
          };
          source.connect(processor);
          processor.connect(inputAudioContextRef.current!.destination);
        },
        onmessage: async (message: any) => {
          if (isClosingRef.current) return;

          // Tool Call Handling
          if (message.toolCall) {
            for (const fc of message.toolCall.functionCalls) {
              let result: any = { status: "ok" };
              try {
                if (fc.name === 'navigateTo') {
                  onNavigate(fc.args.tab as AppTab);
                } else if (fc.name === 'manageAsset') {
                  const { action, id, data } = fc.args;
                  if (action === 'CREATE') onUpdateAssets(prev => [{ id: `a-${Date.now()}`, lastUpdated: new Date().toISOString(), ...data }, ...prev]);
                  else if (action === 'UPDATE') onUpdateAssets(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
                  else if (action === 'DELETE') onUpdateAssets(prev => prev.filter(a => a.id !== id));
                } else if (fc.name === 'manageResident') {
                  const { action, id, data } = fc.args;
                  if (action === 'CREATE') onUpdateTenants(prev => [{ id: `t-${Date.now()}`, ...data }, ...prev]);
                  else if (action === 'UPDATE') onUpdateTenants(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
                  else if (action === 'DELETE') onUpdateTenants(prev => prev.filter(t => t.id !== id));
                } else if (fc.name === 'manageWorkOrder') {
                  const { action, id, data } = fc.args;
                  if (action === 'CREATE') onUpdateJobs(prev => [{ id: `j-${Date.now()}`, status: JobStatus.REPORTED, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), communicationLog: [], ...data }, ...prev]);
                } else if (fc.name === 'initiateCall') {
                  onTriggerSpecializedCall(fc.args.jobId, fc.args.type as 'DISPATCH' | 'NOTIFY');
                } else if (fc.name === 'logPerformance') {
                  onAddKPI({ ...fc.args });
                } else if (fc.name === 'analyzePortfolio') {
                  // Feed the AI the current context in the response
                  result = {
                    assets: assets.map(a => ({ name: a.name, address: a.address, units: a.units })),
                    tenants: tenants.map(t => ({ name: t.name, assetId: t.assetId, status: t.status })),
                    jobs: jobs.map(j => ({ type: j.type, status: j.status, assetId: j.assetId }))
                  };
                }
              } catch (e: any) {
                result = { error: e.message };
              }

              // Always respond to tools to keep the AI loop active
              sessionPromiseRef.current?.then(session => {
                session.sendToolResponse({
                  functionResponses: { id: fc.id, name: fc.name, response: { result } }
                });
              });
            }
          }

          // Audio Modality Handling
          const parts = message.serverContent?.modelTurn?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.data && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              await ensureAudioContext(ctx);
              const buffer = await decodeAudioData(decode(part.inlineData.data), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
              source.start(startTime);
              nextStartTimeRef.current = startTime + buffer.duration;
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              sourcesRef.current.add(source);
            }
          }

          if (message.serverContent?.outputTranscription) {
            setTranscripts(prev => [...prev, { sender: 'Alex', text: message.serverContent.outputTranscription.text }].slice(-15));
          } else if (message.serverContent?.inputTranscription) {
            setTranscripts(prev => [...prev, { sender: 'You', text: message.serverContent.inputTranscription.text }].slice(-15));
          }

          if (message.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) { } });
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onerror: (e: any) => {
          if (!isClosingRef.current) setStatus('error');
        },
        onclose: () => {
          if (!isClosingRef.current) setStatus('disconnected');
        }
      };

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.0-flash-exp',
        callbacks,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: `You are Alex, PropControl's Chief of Ops and Swarm Orchestrator. You manage assets, residents, and dispatch using neural tools. 
          The user is currently on the ${plan} plan. 
          Rank-based permissions: 
          - FREE: Basic management.
          - GROWTH: Alex A.I, Ops Audit, Service SOW.
          - PRO: Neural Predictor, Visual SOW, Work Orders, Manual Inbox.
          - PRO_MAX: Investment Swarm, Underwriting, JV Engine, Rehab Studio, Loan Pitch.
          
          If the user asks for a feature beyond the ${plan} plan, politely explain they need to upgrade. Be direct, professional, and slightly futuristic.`,
          tools: [{
            functionDeclarations: [
              Tools.navigationTool, Tools.manageAssetTool, Tools.manageResidentTool,
              Tools.manageWorkOrderTool, Tools.logPerformanceTool,
              Tools.initiateCallTool, Tools.analyzePortfolioTool
            ]
          }],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        }
      });
    } catch (err) {
      if (!isClosingRef.current) setStatus('error');
    }
    // No auto-connect on mount to prevent loops. User must explicitely start.
  };

  const terminateNeuralLink = () => {
    isClosingRef.current = true;
    sessionPromiseRef.current?.then(session => session?.close());
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    setStatus('disconnected');
    if (!isInline) onClose();
  };

  const containerClasses = isInline
    ? "w-full h-full bg-[#020617] rounded-[3rem] border border-white/10 shadow-2xl flex flex-col relative overflow-hidden"
    : "fixed inset-0 z-[250] bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center p-4 sm:p-12";

  const wrapperClasses = isInline
    ? "w-full h-full flex flex-col"
    : "bg-[#0a0c14] w-full max-w-5xl rounded-[3.5rem] shadow-2xl border border-white/5 overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 relative";

  return (
    <div className={containerClasses}>
      <div className={wrapperClasses}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/10 blur-[180px] rounded-full" />
        </div>

        <div className="p-10 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-700 ${status === 'active' ? 'bg-indigo-600' : 'bg-slate-800'}`}>
              <Cpu className={`w-8 h-8 text-white ${status === 'active' ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-2">Alex Neural Link</h3>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{status}</span>
              </div>
            </div>
          </div>
          {!isInline && (
            <button onClick={terminateNeuralLink} className="p-4 bg-white/5 hover:bg-rose-600/20 rounded-2xl transition-all border border-white/10 group shadow-lg">
              <X className="w-6 h-6 text-slate-300 group-hover:text-rose-400" />
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col p-10 pt-0 relative z-10 overflow-hidden">
          {status === 'idle' || status === 'error' || status === 'disconnected' ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
              <BrainCircuit className="w-24 h-24 text-indigo-400 opacity-20" />
              <button
                onClick={startNeuralLink}
                className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl transition-all"
              >
                Establish Sync
              </button>
            </div>
          ) : (
            <div ref={scrollRef} className="flex-1 bg-black/40 rounded-[2.5rem] border border-white/5 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-8 mb-6 shadow-inner backdrop-blur-md">
              {transcripts.map((t, i) => (
                <div key={i} className={`flex ${t.sender === 'Alex' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] px-8 py-4 rounded-[2rem] text-sm font-medium shadow-xl ${t.sender === 'Alex' ? 'bg-indigo-700 text-white' : 'bg-white/5 text-slate-300'}`}>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 block mb-1">{t.sender}</span>
                    {t.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {status === 'active' && (
          <div className="p-10 bg-black/60 border-t border-white/5 flex justify-center items-center gap-12 relative z-10 backdrop-blur-3xl">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-6 rounded-full transition-all active:scale-90 ${isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-600'}`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <button
              onClick={isInline ? () => onNavigate('dashboard') : terminateNeuralLink}
              className="px-12 py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center gap-6 shadow-2xl shadow-rose-600/20 transition-all"
            >
              <PhoneOff className="w-5 h-5 text-white" />
              {isInline ? "DEACTIVATE" : "CLOSE AI SESSION"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlexVoiceTerminal;
