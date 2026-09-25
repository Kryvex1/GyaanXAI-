import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import {
  auth,
  googleProvider,
  githubProvider,
  signInWithPopup,
  AppUser,
  saveStoredUser,
} from '../firebase.ts';
import { GyaanXLogo } from './GyaanXLogo.tsx';

interface LoginPageProps {
  onLoginSuccess: (user: AppUser) => void;
}

const MP4_VIDEO_URL =
  'https://v1.pinimg.com/videos/iht/expMp4/8e/04/4b/8e044b35c85b45dfd619253859f878ee_720w.mp4';

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.play().catch(() => {
        // Fallback if browser requires interaction
      });
    }
  }, []);

  const handleCopyDomain = () => {
    if (currentHost) {
      navigator.clipboard.writeText(currentHost);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setUnauthorizedDomain(null);
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user: AppUser = {
        uid: res.user.uid,
        displayName: res.user.displayName,
        email: res.user.email,
        photoURL: res.user.photoURL,
      };
      saveStoredUser(user);
      onLoginSuccess(user);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('Sign-in cancelled.');
      } else if (err.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setUnauthorizedDomain(currentHost);
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked by browser. Please allow popups.');
      } else {
        setError(err.message || 'Google sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setError(null);
    setUnauthorizedDomain(null);
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, githubProvider);
      const user: AppUser = {
        uid: res.user.uid,
        displayName: res.user.displayName,
        email: res.user.email,
        photoURL: res.user.photoURL,
      };
      saveStoredUser(user);
      onLoginSuccess(user);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('Sign-in cancelled.');
      } else if (err.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setUnauthorizedDomain(currentHost);
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked by browser. Please allow popups.');
      } else {
        setError(err.message || 'GitHub sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen min-h-[100dvh] overflow-hidden flex items-center justify-center bg-[#060a12] select-none">
      {/* Background Video with Blur & Dark Atmosphere */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          src={MP4_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover scale-105 blur-lg filter brightness-[0.5] contrast-125"
        />
        {/* Soft dark vignette & gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060a12] via-[#060a12]/60 to-[#060a12]/75 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.12),transparent_70%)]" />
      </div>

      {/* Floating Center Login Box */}
      <div className="relative z-10 w-full max-w-md px-4 py-6 sm:px-6">
        <div className="w-full rounded-3xl bg-[#0b1120]/90 border border-white/15 p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl ring-1 ring-white/10 space-y-6 animate-in fade-in zoom-in-95 duration-300">
          
          {/* App Brand Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-1">
              <GyaanXLogo size={46} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              <span>GyaanX</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-sky-300">
                AI
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto leading-relaxed">
              Sign in to start chatting with high-intelligence AI.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-2xl bg-red-950/70 border border-red-800/70 text-xs text-red-200 flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-red-400" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Unauthorized Domain Helper Notice */}
          {unauthorizedDomain && (
            <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-600/40 text-xs text-amber-200 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  This preview domain is not yet whitelisted in Firebase Auth.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/10">
                <code className="text-[11px] text-amber-300 truncate flex-1 font-mono">
                  {unauthorizedDomain}
                </code>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedDomain ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[10px] text-amber-300/80">
                Add to: Firebase Console &rarr; Auth &rarr; Settings &rarr; Authorized domains
              </p>
            </div>
          )}

          {/* Social Sign-In Buttons */}
          <div className="space-y-3 pt-1">
            {/* Google Sign-in */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Connecting Google...' : 'Continue with Google'}</span>
            </button>

            {/* GitHub Sign-in */}
            <button
              type="button"
              onClick={handleGithubLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-[#1e293b] hover:bg-[#27354d] text-white font-semibold text-sm border border-slate-700 shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>{loading ? 'Connecting GitHub...' : 'Continue with GitHub'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
