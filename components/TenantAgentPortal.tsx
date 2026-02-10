
import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Send, Zap, ShieldCheck, Loader2, Sparkles, AlertTriangle, Trash2 } from 'lucide-react';
import { Tenant, Asset, Job, JobStatus, Message, CommunicationEntry } from '../types';
import { startAgentChat } from '../geminiService';

interface TenantAgentPortalProps {
  tenants: Tenant[];
  assets: Asset[];
  onWorkOrderCreated: (job: Job) => void;
  onTenantCreated: (tenant: Tenant) => void;
  persistedMessages: Message[];
  onUpdateMessages: (messages: Message[]) => void;
}

const TenantAgentPortal: React.FC<TenantAgentPortalProps> = ({
  tenants,
  assets,
  onWorkOrderCreated,
  onTenantCreated,
  persistedMessages,
  onUpdateMessages
}) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize chat logic if not already started
  useEffect(() => {
    chatRef.current = startAgentChat();
    // If no history, add greeting
    if (persistedMessages.length === 0) {
      onUpdateMessages([
        { id: '1', sender: 'agent', content: 'Hello! I am your PropControl Concierge. May I have your name to get started?', timestamp: new Date().toISOString() }
      ]);
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [persistedMessages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !chatRef.current) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'tenant', content: input, timestamp: new Date().toISOString() };
    const newHistory = [...persistedMessages, userMsg];
    onUpdateMessages(newHistory);
    setInput('');
    setIsTyping(true);

    try {
      let currentInput = input;
      let toolResponse = null;

      while (true) {
        const response = toolResponse ? await chatRef.current.sendMessage({ message: `[SYSTEM_RESULT]: ${JSON.stringify(toolResponse)}` }) : await chatRef.current.sendMessage({ message: currentInput });
        toolResponse = null;

        if (response.functionCalls && response.functionCalls.length > 0) {
          for (const call of response.functionCalls) {
            if (call.name === 'verifyTenantIdentity') {
              const found = tenants.find(t => t.name.toLowerCase().includes(call.args.name.toLowerCase()));
              toolResponse = found ? { status: 'verified', tenant: found } : { status: 'not_found' };
            }

            if (call.name === 'getAvailableProperties') {
              toolResponse = { properties: assets.map(a => ({ id: a.id, name: a.name, address: a.address })) };
            }

            if (call.name === 'registerNewTenant') {
              const newTenant: Tenant = {
                id: `t-${Date.now()}`,
                name: call.args.name,
                email: call.args.email,
                phone: call.args.phone,
                propertyId: call.args.propertyId,
                leaseEnd: 'Pending'
              };
              onTenantCreated(newTenant);
              toolResponse = { status: 'success', tenant: newTenant };
            }

            if (call.name === 'createWorkOrder') {
              const log: CommunicationEntry[] = newHistory.map(m => ({
                id: m.id,
                timestamp: m.timestamp,
                sender: m.sender === 'agent' ? 'AI Agent' : 'Tenant',
                message: m.content,
                type: 'chat'
              }));

              log.push({
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                sender: 'System',
                message: 'AI Agent triggered automated work order creation.',
                type: 'status_change'
              });

              const newJob: Job = {
                id: `j-${Date.now()}`,
                tenantId: call.args.tenantId,
                propertyId: tenants.find(t => t.id === call.args.tenantId)?.propertyId || call.args.propertyId || 'unknown',
                issueType: call.args.issueType,
                description: call.args.description,
                status: JobStatus.REPORTED,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                communicationLog: log
              };
              onWorkOrderCreated(newJob);
              toolResponse = { status: 'success', jobId: newJob.id };
            }
          }
        } else {
          onUpdateMessages([...newHistory, { id: Date.now().toString(), sender: 'agent', content: response.text, timestamp: new Date().toISOString() }]);
          break;
        }
      }
    } catch (error) {
      console.error(error);
      onUpdateMessages([...newHistory, { id: Date.now().toString(), sender: 'agent', content: "I'm having a bit of a technical hiccup. Could you try that again?", timestamp: new Date().toISOString() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Clear chat history?")) {
      onUpdateMessages([{ id: '1', sender: 'agent', content: 'History cleared. How can I help you today?', timestamp: new Date().toISOString() }]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto h-[700px] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">AI Concierge</h2>
            <div className="flex items-center gap-1.5 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Autonomous Agent Active
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleClearChat}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title="Clear History"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </button>
          <div className="p-2 bg-white/10 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-indigo-300" />
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar">
        {persistedMessages.map(msg => (
          <div key={msg.id} className={`flex gap-4 ${msg.sender === 'agent' ? '' : 'flex-row-reverse'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${msg.sender === 'agent' ? 'bg-white shadow-sm border border-slate-100' : 'bg-indigo-600'
              }`}>
              {msg.sender === 'agent' ? <Bot className="w-5 h-5 text-indigo-600" /> : <User className="w-5 h-5 text-white" />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${msg.sender === 'agent'
              ? 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
              : 'bg-indigo-600 text-white rounded-tr-none'
              }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
              <Bot className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 rounded-tl-none flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-slate-100">
        <div className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tell me about your maintenance issue..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-6 pr-16 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition disabled:opacity-20 shadow-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-indigo-400" /> Persistence Enabled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> End-to-End Encryption
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default TenantAgentPortal;
