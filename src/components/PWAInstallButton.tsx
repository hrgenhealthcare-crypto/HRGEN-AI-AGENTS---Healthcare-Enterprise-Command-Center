import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Download,
  Share2,
  PlusSquare,
  X,
  CheckCircle2,
  Smartphone,
  ExternalLink,
  Laptop,
  Sparkles,
  FileJson,
} from 'lucide-react';
import { StarRingBackground } from './StarRingBackground';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, install, markInstalled, resetInstalled } =
    usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [downloadingApp, setDownloadingApp] = useState(false);
  const [downloadingBundle, setDownloadingBundle] = useState(false);
  const [installSuccessMsg, setInstallSuccessMsg] = useState<string | null>(null);

  // Generates a real, self-contained Desktop & Mobile Web App Launcher (.html)
  // so users inside an iframe preview or desktop browser get an instant working app file
  const handleInstallStandaloneWebApp = async () => {
    setDownloadingApp(true);
    try {
      const appOrigin = window.location.origin;
      const standaloneHtml = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>HRGen Agentic AI — Standalone Enterprise App</title>
  <meta name="theme-color" content="#030712" />
  <link rel="icon" type="image/svg+xml" href="${appOrigin}/icon.svg" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body, html { width: 100%; height: 100%; background: #030712; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; overflow: hidden; display: flex; flex-direction: column; }
    header { height: 42px; background: rgba(5, 8, 17, 0.95); border-bottom: 1px solid rgba(16, 185, 129, 0.25); display: flex; align-items: center; justify-content: space-between; padding: 0 16px; font-size: 12px; }
    .brand { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #10b981; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; }
    .actions a { color: #38bdf8; text-decoration: none; font-weight: 600; padding: 4px 10px; border-radius: 8px; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); }
    iframe { flex: 1; width: 100%; border: none; background: #030712; }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <span class="dot"></span>
      <span>HRGen Agentic AI · Standalone Enterprise Workforce App</span>
    </div>
    <div class="actions">
      <a href="${appOrigin}" target="_blank" rel="noopener noreferrer">Open Full Native Window ↗</a>
    </div>
  </header>
  <iframe src="${appOrigin}" allow="microphone; autoplay; clipboard-write; fullscreen"></iframe>
</body>
</html>`;

      const blob = new Blob([standaloneHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'HRGen-Agentic-AI-App.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      markInstalled();
      setInstallSuccessMsg(
        'HRGen-Agentic-AI-App.html installed & downloaded! Double-click the file anytime to launch the standalone app.'
      );
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingApp(false);
    }
  };

  const handleDownloadBundle = async () => {
    setDownloadingBundle(true);
    try {
      const res = await fetch('/api/export/bundle');
      const data = await res.json();
      const payload = JSON.stringify(data.bundle || data, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'hrgen-agentic-ai-pwa-bundle.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setInstallSuccessMsg('Trained Agent & Hermes Skill Bundle (.json) downloaded!');
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingBundle(false);
    }
  };

  const handlePrimaryClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setShowGuideModal(true);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handlePrimaryClick}
          className={`inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 ${
            compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-xs'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-slate-950" />
          <span>{isInstalled ? 'App Installed (Re-Download / Open)' : 'Install / Download PWA App'}</span>
        </button>

        {isInstalled && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Installed</span>
          </span>
        )}
      </div>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl apple-glass-card overflow-hidden p-6 shadow-2xl text-slate-100 border border-emerald-500/35 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <StarRingBackground variant="card" accentColor="#10b981" secondaryColor="#06b6d4" />

            <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white font-display">
                    HRGen Agentic AI — App Installer
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-400 block">
                    Standalone Desktop & Mobile PWA Package
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {installSuccessMsg && (
              <div className="relative z-10 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{installSuccessMsg}</span>
              </div>
            )}

            {/* Primary 1-Click Direct App Installer */}
            <div className="relative z-10 p-4 rounded-2xl bg-black/45 border border-white/15 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-emerald-400" />
                  <span>Option 1: Direct 1-Click Standalone App Download</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                  INSTANT
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Download the ready-to-run <strong className="text-white">HRGen-Agentic-AI-App.html</strong> launcher directly to your Desktop or Phone. Works immediately even when previewing inside an embedded workspace.
              </p>
              <button
                type="button"
                disabled={downloadingApp}
                onClick={handleInstallStandaloneWebApp}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-98 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>
                  {downloadingApp
                    ? 'Building Standalone App...'
                    : 'Install & Download Standalone App (HRGen-Agentic-AI-App.html)'}
                </span>
              </button>
            </div>

            {/* Option 2: Native Browser PWA Install (Top-level window / iOS / Android) */}
            <div className="relative z-10 p-4 rounded-2xl bg-black/45 border border-white/15 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Option 2: Native Browser PWA Install</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-300">Chrome · Edge · iOS</span>
              </div>

              {isIOS ? (
                <div className="space-y-2 text-slate-300">
                  <p>
                    1. Tap <strong className="text-white">Share</strong>{' '}
                    <Share2 className="inline w-3.5 h-3.5 text-cyan-400" /> in Safari, then tap{' '}
                    <strong className="text-white">Add to Home Screen</strong>{' '}
                    <PlusSquare className="inline w-3.5 h-3.5 text-emerald-400" />.
                  </p>
                </div>
              ) : (
                <p className="text-slate-300 leading-relaxed">
                  {isInIframe
                    ? 'Because this preview is running inside an embedded frame, open the app in a full browser tab to trigger Chrome/Edge’s native address-bar "Install App" prompt:'
                    : 'Click the Install icon in your browser address bar or launch in a dedicated tab:'}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={typeof window !== 'undefined' ? window.location.href : '/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => markInstalled()}
                  className="flex-1 py-2.5 px-3.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Open in Full Browser Tab for Native PWA Install ↗</span>
                </a>
              </div>
            </div>

            {/* Footer: Agent Bundle JSON Export + Done */}
            <div className="relative z-10 pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                disabled={downloadingBundle}
                onClick={handleDownloadBundle}
                className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileJson className="w-3.5 h-3.5 text-emerald-400" />
                <span>{downloadingBundle ? 'Exporting...' : 'Export Trained Agents (.json)'}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {isInstalled && (
                  <button
                    type="button"
                    onClick={resetInstalled}
                    className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] text-slate-400"
                  >
                    Reset Status
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="py-2.5 px-5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold text-white"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
