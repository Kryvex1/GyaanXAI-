import React, { useState, useRef } from 'react';
import {
  X,
  LogOut,
  Camera,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Copy,
} from 'lucide-react';
import {
  auth,
  googleProvider,
  githubProvider,
  signInWithPopup,
  signOut,
  updateProfile,
  AppUser,
  saveStoredUser,
} from '../firebase.ts';
import { uploadToImgBB } from '../imgbb.ts';
import { GyaanXLogo } from './GyaanXLogo.tsx';
import { UserAvatar } from './UserAvatar.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onUserChange: (user: AppUser | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [domainCopied, setDomainCopied] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyDomain = () => {
    if (currentHost) {
      navigator.clipboard.writeText(currentHost);
      setDomainCopied(true);
      setTimeout(() => setDomainCopied(false), 2500);
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
      onUserChange(user);
      setSuccess('Signed in with Google successfully.');
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('Sign-in cancelled.');
      } else if (err.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setUnauthorizedDomain(currentHost);
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups.');
      } else {
        console.warn('Google sign-in notice:', err?.message || err);
        setError(err.message || 'Failed to sign in with Google.');
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
      onUserChange(user);
      setSuccess('Signed in with GitHub successfully.');
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('Sign-in cancelled.');
      } else if (err.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setUnauthorizedDomain(currentHost);
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups.');
      } else {
        console.warn('GitHub sign-in notice:', err?.message || err);
        setError(err.message || 'Failed to sign in with GitHub.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
      saveStoredUser(null);
      onUserChange(null);
      setSuccess('Signed out successfully.');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to sign out.');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    setError(null);
    setUploadingPhoto(true);

    try {
      const result = await uploadToImgBB(file, `${currentUser.uid}_avatar`);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          photoURL: result.url,
        });
      }

      const updatedUser: AppUser = {
        ...currentUser,
        photoURL: result.url,
      };
      saveStoredUser(updatedUser);
      onUserChange(updatedUser);

      setSuccess('Profile photo updated successfully.');
    } catch (err: any) {
      console.error('Photo upload error:', err);
      setError(err.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in select-none">
      <div className="w-full max-w-sm rounded-3xl bg-[#0e1424] border border-[#1b253b] p-6 shadow-2xl space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        {currentUser ? (
          /* Profile Details View */
          <div className="space-y-5">
            <div className="text-center space-y-3">
              <div className="relative inline-block mx-auto">
                <UserAvatar
                  photoURL={currentUser.photoURL}
                  displayName={currentUser.displayName || currentUser.email || 'User'}
                  size={72}
                  className="mx-auto ring-4 ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-transform active:scale-95 cursor-pointer"
                  title="Upload profile photo"
                >
                  {uploadingPhoto ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {currentUser.displayName || 'GyaanX User'}
                </h3>
                <p className="text-xs text-slate-400 font-normal">{currentUser.email}</p>
                <span className="inline-flex items-center gap-1 mt-1 text-[11px] text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                  <ShieldCheck size={12} />
                  Verified Account
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
                <Check size={15} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-[#182033]">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#141d30] hover:bg-[#1a263f] text-xs font-medium text-slate-200 border border-[#212e4a] transition-all cursor-pointer"
              >
                <Camera size={14} className="text-blue-400" />
                <span>{uploadingPhoto ? 'Uploading photo...' : 'Change Profile Photo'}</span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Clean Google & GitHub Login Form */
          <div className="space-y-4">
            <div className="text-center space-y-1.5">
              <div className="flex justify-center mb-1">
                <GyaanXLogo size={52} />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Login to GyaanX AI</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-[260px] mx-auto">
                Sign in with Google or GitHub to start chatting and save your conversations.
              </p>
            </div>

            {/* Unauthorized Domain Explainer Banner if not whitelisted yet */}
            {unauthorizedDomain && (
              <div className="p-3 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-xs space-y-2">
                <div className="flex items-start gap-2 text-amber-300 font-medium">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-400" />
                  <span>Authorized Domain Setup Required</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  In Firebase Console, add this preview domain to Authorized Domains:
                </p>
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/50 border border-amber-500/30 text-[11px] font-mono text-amber-200">
                  <span className="truncate mr-2">{unauthorizedDomain}</span>
                  <button
                    type="button"
                    onClick={handleCopyDomain}
                    className="p-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 flex items-center gap-1 shrink-0"
                    title="Copy domain"
                  >
                    {domainCopied ? <Check size={11} /> : <Copy size={11} />}
                    <span>{domainCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Location: <strong>Firebase Console &rarr; Authentication &rarr; Settings &rarr; Authorized domains</strong>
                </p>
              </div>
            )}

            {error && !unauthorizedDomain && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
                <Check size={15} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              {/* Google Login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* GitHub Login */}
              <button
                type="button"
                onClick={handleGithubLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-2xl bg-[#1b2234] hover:bg-[#232c44] text-white font-semibold text-xs border border-[#2b3754] shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>Continue with GitHub</span>
              </button>
            </div>

            <p className="text-[10.5px] text-slate-500 text-center pt-1">
              By continuing, you agree to GyaanX AI Terms & Privacy.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
