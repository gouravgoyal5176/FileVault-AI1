import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleAuthButtonProps {
  onSuccess: (idToken: string) => void;
  onError: (error: string) => void;
  buttonText?: 'signin_with' | 'signup_with' | 'continue_with';
}

export function GoogleAuthButton({
  onSuccess,
  onError,
  buttonText = 'continue_with',
}: GoogleAuthButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);

  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || '';

  useEffect(() => {
    if (!googleClientId) {
      return;
    }

    // Load Google GIS script dynamically if not present
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      onError('Failed to load Google Sign-In SDK script');
    };
    document.body.appendChild(script);
  }, [googleClientId]);

  useEffect(() => {
    if (!scriptLoaded || !googleClientId || !buttonRef.current || !window.google?.accounts?.id) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response: { credential?: string }) => {
          if (response.credential) {
            onSuccess(response.credential);
          } else {
            onError('Google Sign-In returned empty credential token.');
          }
        },
      });

      // Clear previous button elements before rendering
      buttonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: buttonText,
        shape: 'pill',
        width: 380,
      });
    } catch (err: any) {
      onError(err.message || 'Failed to initialize Google Sign-In button');
    }
  }, [scriptLoaded, googleClientId, buttonText]);

  if (!googleClientId) {
    return (
      <button
        type="button"
        onClick={() =>
          onError('Google Sign-In requires VITE_GOOGLE_CLIENT_ID to be configured in environment.')
        }
        className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2.5 transition cursor-pointer"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        <span>Continue with Google</span>
      </button>
    );
  }

  return <div ref={buttonRef} className="flex justify-center w-full min-h-[44px]" />;
}
