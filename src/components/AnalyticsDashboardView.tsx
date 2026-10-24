import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  BarChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  BarChart3,
  PhoneCall,
  Terminal,
  TrendingUp,
  Zap,
  RefreshCw,
  CheckCircle2,
  Database,
  Users,
  Info,
} from 'lucide-react';

interface RealtimeAnalyticsData {
  provenance?: {
    mode: string;
    disclosure: string;
    liveSessionCounters: {
      persistedVoiceCalls: number;
      persistedCrmLeads: number;
      persistedRagMemories: number;
      sessionBotExecutions: number;
    };
  };
  summary: {
    totalVoiceCalls: number;
    avgSuccessRate: string;
    avgVoiceLatencyMs: number;
    leadConversionRate: string;
    swarmCliTasksExecuted: number;
    metaGoogleRoas: string;
    aeoCitationShare: string;
  };
  timeSeries: {
    time: string;
    voiceCalls: number;
    convertedLeads: number;
    successRate: number;
    latencyMs: number;
    swarmBotTasks: number;
    adRoas: number;
  }[];
  botFleetBreakdown: {
    name: string;
    modality: string;
    tasks: number;
    conversionRate: number;
    latencyMs: number;
    impactScore: number;
  }[];
  funnelStages: {
    stage: string;
    count: number;
    rate: string;
  }[];
}

export const AnalyticsDashboardView: React.FC = () => {
  const [data, setData] = useState<RealtimeAnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/analytics/realtime');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error('Failed to fetch realtime analytics:', e);
    } finally {
      setTimeout(() => setRefreshing(false), 300);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const multiplier = timeRange === '30d' ? 14 : timeRange === '7d' ? 4 : 1;

  const scaledTimeSeries = (data?.timeSeries || []).map((pt) =>
    pt.time === 'Live Session'
      ? pt
      : {
          ...pt,
          voiceCalls: Math.round(pt.voiceCalls * multiplier),
          convertedLeads: Math.round(pt.convertedLeads * multiplier),
          swarmBotTasks: Math.round(pt.swarmBotTasks * multiplier),
        }
  );

  const liveCounters = data?.provenance?.liveSessionCounters || {
    persistedVoiceCalls: data?.summary.totalVoiceCalls ?? 0,
    persistedCrmLeads: 0,
    persistedRagMemories: 0,
    sessionBotExecutions: data?.summary.swarmCliTasksExecuted ?? 0,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header (Clean — No Decorative Rings) */}
      <div className="relative overflow-hidden apple-glass-card rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Workspace Telemetry & Provenance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white font-display tracking-tight">
            Analytics & Live Store Counters
          </h1>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/45 border border-white/10 text-xs">
            {(
              [
                { id: '24h', label: 'Session + 24h Baseline' },
                { id: '7d', label: '7d Baseline' },
                { id: '30d', label: '30d Baseline' },
              ] as const
            ).map((rng) => (
              <button
                key={rng.id}
                onClick={() => setTimeRange(rng.id)}
                className={`px-3 py-1.5 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                  timeRange === rng.id
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {rng.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Live Counts</span>
          </button>
        </div>
      </div>

      {/* Explicit Provenance Banner */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-100">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-cyan-300">Data Provenance Disclosure:</strong>{' '}
          {data?.provenance?.disclosure ||
            'Top KPI cards show live persisted in-memory records from this server session. Historical time-buckets (09:00–17:00) in charts below are seeded demo baselines.'}
        </div>
      </div>

      {/* 4 Live Persisted In-Memory KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -3 }}
          className="apple-glass-card rounded-2xl p-4 border border-emerald-500/25"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Persisted Call Logs</span>
            <PhoneCall className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-display">
            {liveCounters.persistedVoiceCalls}
          </div>
          <div className="text-[11px] font-mono text-emerald-400 mt-1">
            Live In-Memory Store (/api/calls)
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="apple-glass-card rounded-2xl p-4 border border-cyan-500/25"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Persisted CRM Leads</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-display">
            {liveCounters.persistedCrmLeads}
          </div>
          <div className="text-[11px] font-mono text-cyan-300 mt-1">
            Live In-Memory Store (/api/leads)
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="apple-glass-card rounded-2xl p-4 border border-violet-500/25"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Session Bot Runs</span>
            <Terminal className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-display">
            {liveCounters.sessionBotExecutions}
          </div>
          <div className="text-[11px] font-mono text-violet-300 mt-1">
            Non-Dry-Run CLI Executions
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="apple-glass-card rounded-2xl p-4 border border-amber-500/25"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">RAG Memory Chunks</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-display">
            {liveCounters.persistedRagMemories}
          </div>
          <div className="text-[11px] font-mono text-amber-300 mt-1">
            Persisted Knowledge Chunks
          </div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 apple-glass-card rounded-3xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-white font-display">
                Call Volume & Lead Capture Series
              </h3>
              <p className="text-xs text-slate-400">
                09:00–17:00 Demo Baseline + Live Session Bucket
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono text-amber-300">
              Demo Baseline + Live Bucket
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={scaledTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar
                  dataKey="voiceCalls"
                  name="Calls"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                />
                <Line
                  type="monotone"
                  dataKey="convertedLeads"
                  name="Leads"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 apple-glass-card rounded-3xl p-5 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-white font-display">
                Persisted Store Breakdown
              </h3>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="space-y-3">
              {(data?.funnelStages || []).map((f, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{f.stage}</div>
                    <div className="text-[10px] font-mono text-emerald-400">{f.rate}</div>
                  </div>
                  <div className="text-lg font-extrabold font-mono text-cyan-300">
                    {f.count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-400 font-mono">
            External SEO/Search Index Share:{' '}
            <span className="text-amber-300">Not Connected (Local Drafts Only)</span>
          </div>
        </div>
      </div>

      {/* Agent Fleet Activity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="apple-glass-card rounded-3xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-white font-display">
                Agent Pod Interaction Breakdown
              </h3>
              <p className="text-xs text-slate-400">
                Interactions per pod (Seeded baseline + live session increments)
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.botFleetBreakdown || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Bar
                  dataKey="tasks"
                  name="Interactions"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="apple-glass-card rounded-3xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-white font-display">
                Simulated Audio Latency Curve (ms)
              </h3>
              <p className="text-xs text-slate-400">
                Target sub-140ms response profile (Demo Benchmark)
              </p>
            </div>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scaledTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="latencyMs"
                  name="Latency (ms)"
                  stroke="#f59e0b"
                  fill="rgba(245,158,11,0.2)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
