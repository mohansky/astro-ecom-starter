import React from 'react';
import { Toaster } from 'sonner';

interface ToasterProviderProps {
  children: React.ReactNode;
}

export function ToasterProvider({ children }: ToasterProviderProps) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--b1))',
            color: 'hsl(var(--bc))',
            border: '1px solid hsl(var(--b3))',
          },
        }}
        theme="system"
        richColors
      />
    </>
  );
}

export default ToasterProvider;