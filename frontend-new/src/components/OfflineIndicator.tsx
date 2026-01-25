import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-5">
            <div className="flex items-center gap-3 bg-red-600 text-white px-4 py-3 rounded-lg shadow-xl ring-1 ring-white/20">
                <WifiOff className="h-5 w-5 animate-pulse" />
                <div className="flex flex-col">
                    <span className="font-semibold text-sm">Vous êtes hors ligne</span>
                    <span className="text-xs text-white/80">Certaines fonctionnalités peuvent être limitées</span>
                </div>
            </div>
        </div>
    );
}
