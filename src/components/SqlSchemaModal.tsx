import React, { useState, useEffect } from 'react';
import { Database, X, Copy, Check, ShieldCheck, Download, Code2, ArrowUpRight } from 'lucide-react';

interface SqlSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlSchemaModal: React.FC<SqlSchemaModalProps> = ({ isOpen, onClose }) => {
  const [sqlData, setSqlData] = useState<{ filename: string; engine: string; tables: string[]; sql: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch('/api/database/migration-script')
        .then((res) => res.json())
        .then((data) => {
          setSqlData(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load SQL migration:', err);
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!sqlData) return;
    navigator.clipboard.writeText(sqlData.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!sqlData) return;
    const blob = new Blob([sqlData.sql], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', sqlData.filename || '20261024000001_multi_tenant_schema.sql');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-[#0b1220] rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/10 max-h-[90vh] flex flex-col space-y-4 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white font-display flex items-center gap-2">
                <span>Production Multi-Tenant SQL Migration</span>
                <span className="font-mono text-[11px] text-emerald-400 font-semibold">PostgreSQL & Supabase</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                10 Pods Config · RLS Isolation · CRM Pipelines · Zero-Pill Performance Logs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] bg-[#050811]/80 p-3 rounded-2xl border border-white/5 shrink-0">
          <div>
            <span className="text-slate-500 block">Tables</span>
            <span className="text-emerald-400 font-bold">5 Core Tables</span>
          </div>
          <div>
            <span className="text-slate-500 block">Tenant Security</span>
            <span className="text-cyan-400 font-bold">Row-Level Security (RLS)</span>
          </div>
          <div>
            <span className="text-slate-500 block">Fleet Seed</span>
            <span className="text-white font-bold">10 Pods Auto-Seed Trigger</span>
          </div>
          <div>
            <span className="text-slate-500 block">JWT Extractor</span>
            <span className="text-emerald-400 font-bold">current_tenant_id()</span>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-hidden flex flex-col rounded-2xl border border-white/10 bg-[#030712]">
          <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/5 text-xs text-slate-400 font-mono shrink-0">
            <span>{sqlData?.filename || '20261024000001_multi_tenant_schema.sql'}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="min-h-[36px] px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center gap-1.5 transition-colors font-sans text-xs active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied SQL!' : 'Copy Script'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="min-h-[36px] px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs active:scale-95 shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .sql</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300 leading-relaxed">
            {isLoading ? (
              <div className="flex items-center justify-center h-48 text-slate-400 gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Loading SQL schema...</span>
              </div>
            ) : (
              <pre className="whitespace-pre">{sqlData?.sql || '-- Loading migration...'}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
