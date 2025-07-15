'use client';

import { createBrowserClient } from '@supabase/ssr';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { useState } from 'react';
import { UserContextProvider } from '@/contexts/UserContext';
import Navigation from '@/components/Navigation';
import './globals.css';

export function Providers({ children }: { children: React.ReactNode }) {
  const [supabaseClient] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      <UserContextProvider>
        {children}
      </UserContextProvider>
    </SessionContextProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          <Navigation />
          <main className="lg:pl-64">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}