'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // The Firebase context is now fully managed by the FirebaseProvider.
  // We just need to render it.
  return (
    <FirebaseProvider>
      {children}
    </FirebaseProvider>
  );
}
