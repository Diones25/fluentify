import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'fluentify-install-dismissed';

function isStandalone() {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');
  const [installed, setInstalled] = useState(isStandalone);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (installed || hidden || !isMobile) return null;
  if (!deferred && !isIOS) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setDeferred(null);
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setHidden(true);
  }

  return (
    <div className="mb-3 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
      <span className="text-xl">📲</span>
      <div className="flex-1">
        <p className="font-semibold text-emerald-200">Instale o Fluentify no celular</p>
        {isIOS && !deferred ? (
          <p className="mt-1 text-xs text-neutral-400">
            No Safari, toque em Compartilhar → “Adicionar à Tela de Início”.
          </p>
        ) : (
          <p className="mt-1 text-xs text-neutral-400">
            Abra em tela cheia, como um app, sem precisar de loja.
          </p>
        )}
      </div>
      {deferred && (
        <button onClick={install} className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-semibold text-black">
          Instalar
        </button>
      )}
      <button onClick={dismiss} aria-label="Fechar aviso de instalação" className="px-1 text-neutral-500">
        ✕
      </button>
    </div>
  );
}
