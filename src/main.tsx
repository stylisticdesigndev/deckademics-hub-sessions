
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './providers/AuthProvider';
import IOSSplashScreen from './components/pwa/IOSSplashScreen';
import InstallAppPrompt from './components/pwa/InstallAppPrompt';

// Ensure Supabase is properly initialized before rendering the app
import { supabase } from './integrations/supabase/client';

// Only log Supabase connection status in development mode
if (import.meta.env.DEV) {
  console.log('Supabase client initialized', 
    { url: import.meta.env.VITE_SUPABASE_URL || 'using fallback URL' });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

// Clear the app-icon badge count whenever the app is opened or brought to the
// foreground. Best-effort: silently ignored on platforms without the Badging API.
const clearAppBadge = () => {
  try {
    if ('clearAppBadge' in navigator) {
      (navigator as Navigator & { clearAppBadge?: () => Promise<void> })
        .clearAppBadge?.()
        .catch(() => {});
    }
    navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_APP_BADGE' });
  } catch {
    /* ignore */
  }
};
clearAppBadge();
window.addEventListener('focus', clearAppBadge);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') clearAppBadge();
});

createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* PWA splash screen — only visible in standalone (installed) mode */}
        <IOSSplashScreen />
        <App />
        <InstallAppPrompt />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
