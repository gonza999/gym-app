'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('pwa-dismissed')) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-dismissed', '1');
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg p-4 z-40 animate-slide-up">
      <p className="text-sm font-medium dark:text-white">Instalar Gym Tracker</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Accede más rápido desde tu pantalla de inicio
      </p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleInstall}
          className="bg-primary text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700"
        >
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
