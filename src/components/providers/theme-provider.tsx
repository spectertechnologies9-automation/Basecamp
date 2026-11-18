'use client';

import { useEffect, type ReactNode } from 'react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    try {
      // 1. Restore persisted theme tokens
      const savedTokens = localStorage.getItem('nexaflow_theme_tokens');
      if (savedTokens) {
        const tokens = JSON.parse(savedTokens);
        const root = document.documentElement;
        Object.entries(tokens).forEach(([k, v]) => {
          if (typeof v === 'string') root.style.setProperty(k, v);
        });
      }

      // 2. Restore persisted font
      const savedFont = localStorage.getItem('nexaflow_font') || 'lora';
      if (savedFont === 'lora' || savedFont === 'serif') {
        document.documentElement.style.setProperty('--font-sans', '"Lora", Georgia, serif');
        document.body.style.fontFamily = '"Lora", Georgia, serif';
      } else if (savedFont === 'mono') {
        document.documentElement.style.setProperty('--font-sans', '"JetBrains Mono", monospace');
        document.body.style.fontFamily = '"JetBrains Mono", monospace';
      } else {
        document.documentElement.style.setProperty('--font-sans', '"Inter", system-ui, sans-serif');
        document.body.style.fontFamily = '"Inter", system-ui, sans-serif';
      }
    } catch {}
  }, []);

  return (
    <NextThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
