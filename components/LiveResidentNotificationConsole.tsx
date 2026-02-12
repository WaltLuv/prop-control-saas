
import React, { useEffect, useState, useRef } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Loader2,
  Zap,
  ShieldCheck,
  X,
  Volume2,
  BellRing,
  Sparkles
} from 'lucide-react';
import { Job, Asset, Tenant, Contractor, CommunicationEntry } from '../types';
import { connectToResidentNotifier } from '../geminiService';
import { decode, decodeAudioData, createPcmBlob, ensureAudioContext } from '../audioUtils';

interface LiveResidentNotificationConsoleProps {
  job: Job;
  tenant: Tenant;
  asset: Asset;
  vendor?: Contractor;
  onClose: () => void;
  onComplete: (logs: CommunicationEntry[]) => void;
}

const LiveResidentNotificationConsole: React.FC<LiveResidentNotificationConsoleProps> = ({
  job, tenant, asset, vendor, onClose, onComplete
}) => {
  const [status, setStatus] = useState<'connecting' | 'active' | 'disconnected'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [transcripts, setTranscripts] = useState<{ sender: string; text: string }[]>([]);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isClosingRef = useRef(false);

  useEffect(() => {
    startSession();
    return () => {
      isClosingRef.current = true;
      stopSession();
    };
  }, []);

  const startSession = async () => {
    try {
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
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createPcmBlob(inputData);

            sessionPromiseRef.current?.then((session) => {
              if (session) session.sendRealtimeInput({ media: pcmBlob });
            });
          };

          source.connect(processor);
          processor.connect(inputAudioContextRef.current!.destination);
        },
        onmessage: async (message: any) => {
          if (isClosingRef.current) return;

          const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64EncodedAudioString && outputAudioContextRef.current) {
            await ensureAudioContext(outputAudioContextRef.current);
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);

            const audioBuffer = await decodeAudioData(
              decode(base64EncodedAudioString),
              outputAudioContextRef.current,
              24000,
              1
            );

            const source = outputAudioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContextRef.current.destination);

            source.addEventListener('ended', () => sourcesRef.current.delete(source));
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(source);
          }

          if (message.serverContent?.outputTranscription) {
            setTranscripts(prev => [...prev, { sender: 'PropControl AI', text: message.serverContent.outputTranscription.text }]);
          } else if (message.serverContent?.inputTranscription) {
            setTranscripts(prev => [...prev, { sender: tenant.name, text: message.serverContent.inputTranscription.text }]);
          }

          if (message.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) { } });
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onerror: (e: any) => {
          console.error("Live Resident Update Error:", e);
          if (!isClosingRef.current) setStatus('disconnected');
        },
        onclose: () => {
          if (!isClosingRef.current) setStatus('disconnected');
        }
      };

      sessionPromiseRef.current = connectToResidentNotifier(callbacks, job, tenant, asset, vendor);
      await sessionPromiseRef.current;

    } catch (err) {
      console.error("Failed to start Live Resident Notification:", err);
      setStatus('disconnected');
    }
  };

  const stopSession = () => {
    sessionPromiseRef.current?.then(session => session?.close());
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();

    if (status === 'active' && !isClosingRef.current) {
      onComplete([
        {
          id: `resident-call-${Date.now()}`,
          timestamp: new Date().toISOString(),
          sender: 'AI Agent',
          message: `[RESIDENT CONCIERGE CALL ENDED]: PropControl AI successfully updated ${tenant.name} on work order #${job.id.split('-').pop()}.`,
          type: 'notification'
        }
      ]);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-indigo-950/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[#0f172a] w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col h-[650px] animate-in zoom-in-95 duration-500">

        <div className="p-8 bg-gradient-to-b from-indigo-500/10 to-transparent flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-600/30">
              <BellRing className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight uppercase">Resident Concierge Call</h3>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {status === 'connecting' ? 'Establishing Line...' : status === 'active' ? 'Voice Link to ' + tenant.name : 'Call Terminated'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-white transition-all bg-white/5 rounded-xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 p-8 flex flex-col gap-6 overflow-hidden">
          <div className="flex-1 bg-black/50 rounded-3xl border border-white/5 p-6 overflow-y-auto space-y-4 custom-scrollbar shadow-inner">
            {transcripts.length === 0 && status === 'active' && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Initializing Human-Centric Voice Link...</p>
              </div>
            )}
            {transcripts.map((t, i) => (
              <div key={i} className={`flex gap-3 ${t.sender === 'PropControl AI' ? '' : 'flex-row-reverse'}`}>
                <div className={`px-5 py-3 rounded-2xl text-xs font-bold leading-relaxed shadow-lg ${t.sender === 'PropControl AI' ? 'bg-indigo-600 text-white rounded-tl-none' : 'bg-slate-800 text-indigo-100 rounded-tr-none'
                  }`}>
                  <span className="opacity-40 mr-2 uppercase text-[9px] font-black">{t.sender}</span>
                  {t.text}
                </div>
              </div>
            ))}
          </div>

          <div className="h-20 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center gap-1.5 px-6">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-300 ${status === 'active' ? 'bg-indigo-500' : 'bg-slate-800 opacity-20'}`}
                style={{
                  height: status === 'active' && !isMuted ? `${Math.random() * 40 + 10}px` : '4px',
                  animation: status === 'active' && !isMuted ? `pulse-bar 1s ease-in-out infinite ${i * 30}ms` : 'none'
                }}
              />
            ))}
          </div>
        </div>

        <div className="p-8 bg-black/40 border-t border-white/5 flex justify-center items-center gap-8">
          <button
            onClick={async () => {
              await ensureAudioContext(inputAudioContextRef.current);
              setIsMuted(!isMuted);
            }}
            className={`p-6 rounded-full transition-all active:scale-90 shadow-2xl ${isMuted ? 'bg-rose-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <button
            onClick={stopSession}
            className="px-14 py-6 bg-rose-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center gap-4 shadow-2xl shadow-rose-600/30 hover:bg-rose-500 transition-all active:scale-95 group"
          >
            <PhoneOff className="w-6 h-6 group-hover:scale-110 transition-transform" />
            End Resident Update
          </button>

          <button className="p-5 rounded-full bg-white/5 text-slate-400 hover:bg-white/10 transition-all active:scale-90">
            <Volume2 className="w-6 h-6" />
          </button>
        </div>

        <div className="px-8 pb-6 text-center">
          <div className="flex items-center justify-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">
            <Sparkles className="w-3 h-3" />
            Active Resident Satisfaction Guardian
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse-bar { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.4); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default LiveResidentNotificationConsole;
