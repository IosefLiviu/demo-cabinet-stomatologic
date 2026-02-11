import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Check, Smartphone, Monitor } from 'lucide-react';
import perfectSmileLogo from '@/assets/perfect-smile-logo.png';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <img src={perfectSmileLogo} alt="Perfect Smile" className="h-20 w-20 mx-auto mb-4 object-contain" />
          <CardTitle className="text-2xl">PerfectSmileGlim</CardTitle>
          <CardDescription>Instalează aplicația pe telefonul tău</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInstalled ? (
            <div className="text-center space-y-3">
              <div className="h-16 w-16 mx-auto rounded-full bg-accent flex items-center justify-center">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Aplicația este deja instalată!</p>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = '/'}>
                Deschide aplicația
              </Button>
            </div>
          ) : isIOS ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Smartphone className="h-5 w-5 text-primary shrink-0" />
                <p className="text-sm">Pe iPhone/iPad, urmează pașii:</p>
              </div>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Apasă butonul <strong>Share</strong> (↑) din Safari</li>
                <li>Selectează <strong>"Add to Home Screen"</strong></li>
                <li>Apasă <strong>"Add"</strong></li>
              </ol>
            </div>
          ) : deferredPrompt ? (
            <Button onClick={handleInstall} className="w-full gap-2" size="lg">
              <Download className="h-5 w-5" />
              Instalează aplicația
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Monitor className="h-5 w-5 text-primary shrink-0" />
                <p className="text-sm">Deschide pagina în Chrome sau Edge pe telefon, apoi folosește meniul browserului pentru a instala.</p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t space-y-2">
            <h4 className="text-sm font-medium">De ce să instalezi?</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✓ Acces rapid de pe ecranul principal</li>
              <li>✓ Funcționează ca o aplicație nativă</li>
              <li>✓ Se încarcă mai rapid</li>
              <li>✓ Nu ocupă spațiu semnificativ</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
