
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './providers/AuthProvider';

// Ensure Supabase is properly initialized before rendering the app
import { supabase } from './integrations/supabase/client';

// Only log Supabase connection status in development mode
if (import.meta.env.DEV) {
  console.log('Supabase client initialized', 
    { url: import.meta.env.VITE_SUPABASE_URL || 'using fallback URL' });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
