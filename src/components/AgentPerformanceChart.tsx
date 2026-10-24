import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, ComposedChart, Bar, Line, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { TrendingUp, BarChart3, ArrowUpRight, Flame, Sparkles } from 'lucide-react';
import { AgentPerformanceMetric } from '../types';
import { StarRingBackground } from './StarRingBackground';

interface AgentPerformanceChartProps {
  className?: string;
}

export const AgentPerformanceChart: React.FC<AgentPerformanceChartProps> = ({ className = '' }) => {
  const [data, setData] = useState<AgentPerformanceMetric[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'top_converting' | 'high_volume'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/agent-performance')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.metrics) {
          setData(resData.metrics);
        }
      })
      .catch((err) => console.error('Failed to load performance metrics:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const displayData = React.useMemo(() => {
    if (filterMode === 'top_converting') {
      return [...data].sort((a, b) => b.conversionRate - a.conversionRate).slice(0, 6);
    }
    if (filterMode === 'high_volume') {
      return [...data].sort((a, b) => b.callsHandled - a.callsHandled).slice(0, 6);
    }
    return data;
  }, [data, filterMode]);

  // Format short first names for X-Axis
  const chartData = displayData.map((d) => ({
    ...d,
    shortName: d.podName.split(' ')[0],
  }));

  // Custom Dark Glass Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as AgentPerformanceMetric & { shortName: string };
      return (
        <div className="bg-[#070b14]/95 backdrop-blur-xl border border-emerald-500/30 p-3.5 rounded-2xl shadow-2xl text-xs space-y-1.5 min-w-[200px]">
          <div className="flex items-center justify-between pb-1 border-b border-white/10 font-mono">
            <span className="font-bold text-white text-sm font-display">{item.podName}</span>
            {item.trendVelocity && (
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                {item.trendVelocity}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">{item.role}</p>
          <div className="pt-1 space-y-1 font-mono text-[11px] tabular-nums">
            <div className="flex justify-between">
              <span className="text-slate-400">Calls Handled:</span>
              <strong className="text-emerald-400">{item.callsHandled.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Converted Leads:</span>
              <strong className="text-cyan-400">{item.convertedCalls.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/5">
              <span className="text-slate-300">Conversion Rate:</span>
              <strong className="text-emerald-300 text-xs font-bold">{item.conversionRate}%</strong>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`relative overflow-hidden apple-glass-card rounded-3xl p-5 sm:p-6 space-y-4 ${className}`}>
      <StarRingBackground variant="card" accentColor="#10b981" secondaryColor="#06b6d4" />

      {/* Header & Filter Controls */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold tracking-wider uppercase">30-Day Fleet Analytics</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight font-display mt-0.5">
            Calls Handled vs. Conversion Rate %
          </h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl text-xs self-start sm:self-auto font-medium">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterMode === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Pods
          </button>
          <button
            onClick={() => setFilterMode('top_converting')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterMode === 'top_converting'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Top Converting
          </button>
          <button
            onClick={() => setFilterMode('high_volume')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterMode === 'high_volume'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Highest Volume
          </button>
        </div>
      </div>

      {/* Legend & Stats Quick Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-500" />
            <span>Calls Handled (Left Y-Axis)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Conversion Rate % (Right Y-Axis)</span>
          </div>
        </div>

        <div className="text-[11px] text-emerald-400 tabular-nums">
          <span>Avg Fleet Conversion: <strong>81.2%</strong></span>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="h-72 sm:h-80 w-full pt-2">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
            Loading 30-day analytics telemetry...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" opacity={0.6} vertical={false} />
              
              <XAxis 
                dataKey="shortName" 
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} 
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
                interval={0}
              />
              
              {/* Left Y-Axis for Calls Volume */}
              <YAxis 
                yAxisId="left"
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
                domain={[0, 1600]}
              />

              {/* Right Y-Axis for Conversion Rate % */}
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#06b6d4', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
                domain={[60, 100]}
                unit="%"
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Volume Bars */}
              <Bar 
                yAxisId="left"
                dataKey="callsHandled" 
                name="Calls Handled"
                fill="#10b981" 
                radius={[6, 6, 0, 0]} 
                maxBarSize={36}
              />

              {/* Conversion Line */}
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="conversionRate" 
                name="Conversion Rate %"
                stroke="#06b6d4" 
                strokeWidth={2.5}
                dot={{ fill: '#06b6d4', stroke: '#070b14', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#00f5a0', stroke: '#fff', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
