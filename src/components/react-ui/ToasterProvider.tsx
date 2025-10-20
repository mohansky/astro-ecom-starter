import React from 'react';
import { Toaster } from 'sonner';

interface ToasterProviderProps {
  children?: React.ReactNode;
}

export function ToasterProvider({ children }: ToasterProviderProps) {
  return (
    <>
      {children}
      <Toaster position="bottom-right" richColors />
    </>
  );
}

export default ToasterProvider;
