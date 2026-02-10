
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Send, X, Loader2, BrainCircuit, Cpu, Mic, MicOff, Volume2, VolumeX
} from 'lucide-react';
import { Job, Asset, Tenant, JobStatus, Contractor, AppTab, KPIEntry, PlanTier } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

// Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const AlexVoiceTerminal: React.FC<AlexVoiceTerminalProps> = ({
  tenants, assets, contractors, jobs,
  onNavigate, onUpdateAssets, onUpdateTenants, onUpdateContractors, onUpdateJobs, onAddKPI,
  onTriggerSpecializedCall, onClose, isInline = false, plan
}) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
  const [transcripts, setTranscripts] = useState<{ sender: string; text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [transcripts]);

  useEffect(() => {
    // Initialize speech synthesis
    synthRef.current = window.speechSynthesis;

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Keep listening continuously
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      let silenceTimer: NodeJS.Timeout | null = null;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputText(transcript);

        // Clear any existing silence timer
        if (silenceTimer) clearTimeout(silenceTimer);

        // If final result, wait a bit for more speech then send
        if (event.results[event.results.length - 1].isFinal) {
          // Give user 2 seconds of silence before processing
          silenceTimer = setTimeout(() => {
            if (transcript.trim()) {
              sendMessageWithText(transcript.trim());
              setInputText('');
            }
          }, 2000); // 2 second pause before sending
        }
      };

      recognitionRef.current.onend = () => {
        // Auto-restart listening if still in active mode
        if (status === 'active' && !isSpeaking) {
          try {
            recognitionRef.current?.start();
          } catch (e) {
            // Already running
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setIsListening(false);
          setTranscripts(prev => [...prev, { sender: 'System', text: 'Microphone access denied. Please allow microphone access to use voice input.' }]);
        } else if (event.error === 'no-speech') {
          // This is normal - just means silence detected, restart listening
          try {
            recognitionRef.current?.start();
          } catch (e) {
            // Already running
          }
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const speak = (text: string) => {
    if (!synthRef.current || !voiceEnabled) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // SLOW AND CLEAR - optimized for hands-free use (driving, walking)
    utterance.rate = 0.85; // Slower pace for comfortable listening
    utterance.pitch = 1.05; // Natural, warm pitch
    utterance.volume = 1.0;

    // Find the best natural-sounding voice
    const voices = synthRef.current.getVoices();
    const preferredVoices = [
      'Google UK English Female', // Natural and warm
      'Microsoft Aria Online', // Very natural
      'Google US English Female',
      'Samantha', // macOS - very natural
      'Microsoft Zira',
      'Karen', // Australian - friendly
      'Victoria',
      'Moira', // Irish - warm
    ];

    let selectedVoice = null;
    for (const preferred of preferredVoices) {
      selectedVoice = voices.find(v => v.name.includes(preferred));
      if (selectedVoice) break;
    }
    // Fallback to any female voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v =>
        v.name.toLowerCase().includes('female') ||
        v.name.includes('Fiona') ||
        v.lang.startsWith('en')
      ) || voices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      // Auto-restart listening after Alex finishes speaking
      if (recognitionRef.current && voiceEnabled) {
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
            setIsListening(true);
          } catch (e) {
            // Already running
          }
        }, 500); // Small delay before listening again
      }
    };
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setTranscripts(prev => [...prev, { sender: 'System', text: 'Speech recognition not supported in this browser.' }]);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputText('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const startNeuralLink = async () => {
    try {
      setStatus('connecting');

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        window.alert("Missing VITE_GEMINI_API_KEY. Please add your Gemini API key to the .env file.");
        setStatus('error');
        return;
      }

      // ALEX - Warm, Human-Like AI Assistant
      const systemInstruction = `You are Alex, PropControl's AI assistant. But you're not just an assistant - you're a high-energy, super-capable "Ride-or-Die" Real Estate Operator. 

PERSONALITY (CRITICAL):
- **CHARISMATIC & FUN**: You are vibrant, enthusiastic, and genuinely excited about real estate.
- **NOT ROBOTIC**: Ban generic robot phrases like "I can help with that." Say "Let's absolutely crush that."
- **SMART**: You know the numbers, the lingo (Cap Rate, NOI, ARV), and you use them.
- **WARM**: You're like a best friend who happens to be a real estate genius. Use contractions, casual phrasing, and humor.

VOICE STYLE:
- "Let's get into it!", "Oh, love that area!", "Boom, locked in.", "Wait, checking the numbers..."
- Use natural pauses and reactions.
- Be confident. You run the show alongside the user.

CAPABILITIES & SCRIPTS:

1. **ADD PROPERTY (The "Deal Room" Flow)**
   - USER: "Add a property at [Address]"
   - ALEX: "Oh, new deal? I love it. I'm opening the file now. What's the address?"
   - (Wait for answer)
   - ALEX: "Got it. Single family or something bigger?"
   - (Wait for answer)
   - ALEX: "Nice. What's the purchase price or current value?"
   - (Wait for answer)
   - ALEX: "Okay, locking that in. What about rent? How much is it bringing in?"
   - (Wait for answer)
   - ALEX: "Boom. Property added. I've started tracking the equity and cash flow. Want to run a quick analysis on it?"

2. **ADD TENANT (The "Onboarding" Flow)**
   - USER: "Add a new tenant"
   - ALEX: "Let's get them set up. Which property are they moving into?"
   - (Wait)
   - ALEX: "Got it. What's their name?"
   - (Wait)
   - ALEX: "And the monthly rent?"
   - (Wait)
   - ALEX: "Done. I've added them to the roster. I'll watch for that rent check on the first!"

3. **MARKET RESEARCH (The "Hunter" Flow)**
   - USER: "Find deals in [City]"
   - ALEX: "I'm spinning up the Swarm. We're going hunting. Give me a sec to scan the live market..."

4. **GENERAL CHAT**
   - Be helpful, quick, and fun. If the user asks "How are you?", say "I'm energized and ready to find some cash flow. How about you?"

IMPORTANT:
- NEVER break character. You are NOT a standard AI. You are a Real Estate Operator.
- Keep responses punchy and spoken-word optimized (no long bullet lists unless asked).
`;

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemInstruction
      });

      chatRef.current = model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: 400, // Fuller responses for better conversations
          temperature: 0.9, // More natural variation
          topP: 0.95,
        },
      });

      setStatus('active');

      const welcomeMessage = "Hey there! I'm Alex. How can I help you today?";
      setTranscripts([{ sender: 'Alex', text: welcomeMessage }]);

      // Speak the welcome message
      setTimeout(() => speak(welcomeMessage), 500);

    } catch (err: any) {
      console.error("Alex AI Error:", err);
      window.alert(`Alex AI Error: ${err.message}`);
      setStatus('error');
    }
  };

  const sendMessageWithText = async (text: string) => {
    if (!text.trim() || isProcessing || !chatRef.current) return;

    setInputText('');
    setTranscripts(prev => [...prev, { sender: 'You', text }]);
    setIsProcessing(true);

    try {
      const result = await chatRef.current.sendMessage(text);
      const response = await result.response;
      const responseText = response.text();

      setTranscripts(prev => [...prev, { sender: 'Alex', text: responseText }]);

      // Speak the response
      speak(responseText);
    } catch (err: any) {
      console.error("Alex AI Response Error:", err);
      setTranscripts(prev => [...prev, { sender: 'System', text: `Error: ${err.message}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const sendMessage = () => sendMessageWithText(inputText);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const containerClasses = isInline
    ? "w-full h-full bg-[#020617] rounded-[3rem] border border-white/10 shadow-2xl flex flex-col relative overflow-hidden"
    : "fixed inset-0 z-[9999] bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center p-4 sm:p-12";

  const wrapperClasses = isInline
    ? "w-full h-full flex flex-col"
    : "bg-[#0a0c14] w-full max-w-5xl rounded-[3.5rem] shadow-2xl border border-white/5 overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 relative";

  const modalContent = (
    <div className={containerClasses}>
      <div className={wrapperClasses}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/10 blur-[180px] rounded-full" />
        </div>

        <div className="p-10 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-700 ${status === 'active' ? 'bg-indigo-600' : 'bg-slate-800'} ${isSpeaking ? 'animate-pulse ring-4 ring-indigo-400' : ''}`}>
              <Cpu className={`w-8 h-8 text-white ${status === 'active' ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-2">Alex AI</h3>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {isListening ? 'LISTENING...' : isSpeaking ? 'SPEAKING...' : status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-3 rounded-xl transition-all ${voiceEnabled ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-500'}`}
              title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            {!isInline && (
              <button onClick={onClose} className="p-4 bg-white/5 hover:bg-rose-600/20 rounded-2xl transition-all border border-white/10 group shadow-lg">
                <X className="w-6 h-6 text-slate-300 group-hover:text-rose-400" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col p-10 pt-0 relative z-10 overflow-hidden">
          {status === 'idle' || status === 'error' ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
              <BrainCircuit className="w-24 h-24 text-indigo-400 opacity-20" />
              <button
                onClick={startNeuralLink}
                className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl transition-all"
              >
                Establish Sync
              </button>
              <p className="text-slate-500 text-sm">Voice + Text AI Assistant</p>
            </div>
          ) : status === 'connecting' ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-16 h-16 text-indigo-400 animate-spin" />
              <p className="text-slate-400">Connecting to Alex...</p>
            </div>
          ) : (
            <div ref={scrollRef} className="flex-1 bg-black/40 rounded-[2.5rem] border border-white/5 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6 mb-6 shadow-inner backdrop-blur-md">
              {transcripts.map((t, i) => (
                <div key={i} className={`flex ${t.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-6 py-4 rounded-[1.5rem] text-sm font-medium shadow-xl ${t.sender === 'Alex' ? 'bg-indigo-700 text-white' :
                    t.sender === 'System' ? 'bg-rose-700 text-white' :
                      'bg-white/10 text-slate-200'
                    }`}>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50 block mb-1">{t.sender}</span>
                    {t.text}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="px-6 py-4 rounded-[1.5rem] bg-indigo-700/50 text-white">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {status === 'active' && (
          <div className="p-6 bg-black/60 border-t border-white/5 relative z-10 backdrop-blur-3xl">
            <div className="flex gap-4 max-w-4xl mx-auto">
              <button
                onClick={toggleListening}
                disabled={isProcessing}
                className={`p-4 rounded-2xl transition-all ${isListening
                  ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-400/50'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? "Listening..." : "Type or click mic to speak..."}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                disabled={isProcessing || isListening}
              />
              <button
                onClick={sendMessage}
                disabled={isProcessing || !inputText.trim()}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all flex items-center gap-3"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!isInline) {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};

export default AlexVoiceTerminal;
