'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useState } from 'react';

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="top-right"
        richColors
        closeButton
        expand
        theme="light"
        duration={3000}
      />
      {children}
    </QueryClientProvider>
  );
}
