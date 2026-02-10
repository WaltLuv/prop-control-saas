import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Bell, Zap, Percent, Activity, Shield, Users } from 'lucide-react';

export default function SwarmMissionControl() {
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        auto_skip_trace: false,
        auto_mail_distress: false,
        enable_sms_alerts: true,
        min_equity_percent: 40,
        max_condition_score: 5,
        daily_budget_limit_cents: 500
    });

    // Fetch settings on load
    useEffect(() => {
        async function loadSettings() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data, error } = await supabase
                        .from('user_settings')
                        .select('*')
                        .eq('user_id', user.id)
                        .single();

                    if (error && error.code !== 'PGRST116') {
                        console.error('Error loading settings:', error);
                    }

                    if (data) {
                        setSettings(data);
                    } else {
                        // Initialize if not exists
                        const { data: newData } = await supabase
                            .from('user_settings')
                            .insert({ user_id: user.id })
                            .select()
                            .single();
                        if (newData) setSettings(newData);
                    }
                }
            } catch (err) {
                console.error('Failed to load swarm settings:', err);
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, []);

    const updateSetting = async (key: string, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase
                    .from('user_settings')
                    .update({ [key]: value })
                    .eq('user_id', user.id);
                if (error) console.error('Error saving setting:', error);
            }
        } catch (err) {
            console.error('Failed to save swarm setting:', err);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Syncing with Mission Control...</p>
        </div>
    );

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-10 text-white shadow-2xl relative overflow-hidden group max-w-2xl mx-auto">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <Settings className="w-48 h-48" />
            </div>

            <div className="relative z-10 space-y-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Users className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Mission Parameters</h2>
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">Acquisition Swarm <span className="text-slate-500">v2.5</span></h3>
                    <p className="text-slate-400 text-sm font-medium mt-2">Fine-tune your PARL orchestration logic and automated triggers.</p>
                </div>

                <div className="space-y-6">
                    {/* SMS Alerts Toggle */}
                    <div className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl hover:border-white/10 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                <Bell className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-100 uppercase tracking-tight">Mobile Strike Alerts</p>
                                <p className="text-[10px] font-medium text-slate-500">Get SMS triggers for "Gold Mine" properties immediately.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => updateSetting('enable_sms_alerts', !settings.enable_sms_alerts)}
                            className={`w-14 h-8 rounded-full transition-all relative ${settings.enable_sms_alerts ? 'bg-emerald-500' : 'bg-slate-800 border border-white/5'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-lg ${settings.enable_sms_alerts ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    {/* Auto Skip-Trace Toggle */}
                    <div className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl hover:border-white/10 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl">
                                <Zap className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-100 uppercase tracking-tight">Auto-Pulse Skip-Tracing</p>
                                <p className="text-[10px] font-medium text-slate-500">Automatically discover phone numbers if vision score {'<'} 4.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => updateSetting('auto_skip_trace', !settings.auto_skip_trace)}
                            className={`w-14 h-8 rounded-full transition-all relative ${settings.auto_skip_trace ? 'bg-indigo-500' : 'bg-slate-800 border border-white/5'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-lg ${settings.auto_skip_trace ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    {/* Equity Threshold Slider */}
                    <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between font-black uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <Percent className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-[10px] text-slate-400">Min Equity Threshold</span>
                            </div>
                            <span className="text-lg text-amber-400">{settings.min_equity_percent}%</span>
                        </div>
                        <input
                            type="range" min="0" max="100" step="5"
                            value={settings.min_equity_percent}
                            onChange={(e) => updateSetting('min_equity_percent', parseInt(e.target.value) || 0)}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <p className="text-[9px] font-medium text-slate-500 text-center">The swarm will ignore any properties below this equity level.</p>
                    </div>

                    {/* Condition Filter */}
                    <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between font-black uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5 text-rose-500" />
                                <span className="text-[10px] text-slate-400">Max Condition Score (Ugly House)</span>
                            </div>
                            <span className="text-lg text-rose-400">{settings.max_condition_score}/10</span>
                        </div>
                        <input
                            type="range" min="1" max="10"
                            value={settings.max_condition_score}
                            onChange={(e) => updateSetting('max_condition_score', parseInt(e.target.value) || 1)}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                        />
                        <p className="text-[9px] font-medium text-slate-500 text-center">Score of 1 = Total Distressed. Score of 10 = New Build.</p>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">All Parameters Synchronized</p>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Kimi 2.5 Core: Active</p>
                </div>
            </div>
        </div>
    );
}
