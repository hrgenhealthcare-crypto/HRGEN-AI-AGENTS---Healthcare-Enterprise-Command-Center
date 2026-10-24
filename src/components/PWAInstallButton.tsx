import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 rounded-lg bg-teal-600 font-semibold text-white shadow-2xs hover:bg-teal-700 transition-colors ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-xs'
        }`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-lg border border-slate-300 font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors ${
            compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-teal-600" />
          <span>Install PWA</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-slate-900 border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Install HRGEN on iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0">
                    1
                  </div>
                  <p>
                    Tap the <strong className="text-slate-900">Share</strong> button{' '}
                    <Share2 className="inline w-3.5 h-3.5 text-blue-500" /> in the Safari toolbar.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0">
                    2
                  </div>
                  <p>
                    Scroll down and select{' '}
                    <strong className="text-slate-900">Add to Home Screen</strong>{' '}
                    <PlusSquare className="inline w-3.5 h-3.5 text-slate-700" />.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0">
                    3
                  </div>
                  <p>
                    Tap <strong className="text-slate-900">Add</strong> in top right. Launch HRGEN AI like a native full-screen app!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-teal-600 py-2.5 text-xs font-semibold text-white hover:bg-teal-700 shadow-2xs"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback ambient desktop button if prompt not yet fired
  return (
    <button
      onClick={() => alert('To install HRGEN AI AGENTS, click the install icon (⊕ or ⬇) in your browser address bar.')}
      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
      title="Install as Progressive Web App"
    >
      <Download className="w-3.5 h-3.5 text-teal-600" />
      <span>Install PWA</span>
    </button>
  );
};
