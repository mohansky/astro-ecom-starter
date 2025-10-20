import React from 'react';
import { QueryProvider } from '@/providers/QueryProvider';

interface WithQueryProviderProps {
  children: React.ReactNode;
}

export function WithQueryProvider({ children }: WithQueryProviderProps) {
  return <QueryProvider>{children}</QueryProvider>;
}
