'use client';

// Minimal standalone toast utility used by design-studio etc.
// In production, wire to a full toast library like sonner or react-hot-toast.

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
};

export function toast(opts: ToastOptions) {
  const { title, description, variant } = opts;
  const msg = [title, description].filter(Boolean).join(' — ');
  // Browser native fallback (works without any UI dep)
  if (typeof window !== 'undefined') {
    // Create a transient DOM toast
    const el = document.createElement('div');
    el.setAttribute('role', 'alert');
    el.style.cssText = [
      'position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999',
      'padding:0.875rem 1.25rem;border-radius:0.75rem',
      'font-size:0.875rem;font-family:inherit;max-width:360px',
      'box-shadow:0 4px 24px rgba(0,0,0,0.4)',
      variant === 'destructive'
        ? 'background:#E56B70;color:#fff'
        : variant === 'success'
        ? 'background:#52B788;color:#fff'
        : 'background:#22333B;color:#F2F6F8;border:1px solid #35464E',
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}

export function useToast() {
  return { toast };
}
