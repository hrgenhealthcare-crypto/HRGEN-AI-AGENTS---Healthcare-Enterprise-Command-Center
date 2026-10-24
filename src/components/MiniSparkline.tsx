import React from 'react';
import { motion } from 'framer-motion';

interface MiniSparklineProps {
  data?: number[];
  color?: string;
  gradientId?: string;
  label?: string;
  trendText?: string;
  height?: number;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data = [65, 72, 70, 84, 88, 92, 98],
  color = '#10b981',
  gradientId = 'spark-grad-default',
  label = 'Success & Turns Trend',
  trendText = '+14.6%',
  height = 42,
}) => {
  const width = 180;
  const paddingY = 6;
  const paddingX = 4;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  // Convert points to SVG coordinates
  const points = data.map((val, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((val - minVal) / range) * (height - paddingY * 2);
    return { x, y };
  });

  // Generate smooth SVG path (cubic bezier)
  const pathData = points.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[idx - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (pt.x - prev.x) / 2;
    const cp2y = pt.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.x} ${pt.y}`;
  }, '');

  // Closed area path for gradient fill
  const lastPt = points[points.length - 1];
  const firstPt = points[0];
  const areaData = `${pathData} L ${lastPt.x} ${height} L ${firstPt.x} ${height} Z`;

  return (
    <div className="w-full bg-[#050811]/80 rounded-xl p-2.5 border border-white/5 space-y-1">
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-slate-400 font-sans">{label}</span>
        <span className="text-emerald-400 font-bold flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {trendText}
        </span>
      </div>

      <div className="relative w-full overflow-hidden" style={{ height: `${height}px` }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          <motion.path
            d={areaData}
            fill={`url(#${gradientId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />

          {/* Animated trend stroke */}
          <motion.path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />

          {/* Pulsing dot at last point */}
          <motion.circle
            cx={lastPt.x}
            cy={lastPt.y}
            r="3"
            fill={color}
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          />
        </svg>
      </div>
    </div>
  );
};
