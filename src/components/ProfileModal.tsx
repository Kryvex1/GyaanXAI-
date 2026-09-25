import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  LogOut,
  Save,
  Key,
  User as UserIcon,
  Cpu,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  Zap,
  Sparkles,
  Compass,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  AppUser,
  updateProfile,
  auth,
  signInWithPopup,
  googleProvider,
  signOut,
} from '../firebase.ts';
import { ChatSettings, ToneType } from '../types.ts';
import { UserAvatar } from './UserAvatar.tsx';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onUpdateUser: (user: AppUser | null) => void;
  settings: ChatSettings;
  onUpdateSettings: (newSettings: ChatSettings) => void;
  onRequireLogin?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  settings,
  onUpdateSettings,
  onRequireLogin,
}) => {
  const initialName =
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    (currentUser ? 'User' : 'Guest');

  const [displayName, setDisplayName] = useState(initialName);
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || '');
  const [systemInstruction, setSystemInstruction] = useState(settings.systemInstruction || '');
  const [tone, setTone] = useState<ToneType>(settings.tone || 'hinglish');
  const [selectedModel, setSelectedModel] = useState<string>(
    settings.model || 'gemini-3.1-flash-lite'
  );
  const [customApiKey, setCustomApiKey] = useState(settings.customApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoURL(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim() || null,
          photoURL: photoURL.trim() || null,
        }).catch((err) => console.warn('updateProfile error:', err));
      }

      const updatedUser: AppUser = {
        uid: currentUser?.uid || auth.currentUser?.uid || 'guest_user',
        displayName: displayName.trim() || 'User',
        email: currentUser?.email || auth.currentUser?.email || null,
        photoURL: photoURL.trim() || null,
        isGuest: !currentUser?.email,
      };
      onUpdateUser(updatedUser);

      const updatedSettings: ChatSettings = {
        ...settings,
        model: selectedModel as any,
        systemInstruction: systemInstruction.trim(),
        tone,
        customApiKey: customApiKey.trim(),
      };
      onUpdateSettings(updatedSettings);

      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        const u: AppUser = {
          uid: res.user.uid,
          displayName: res.user.displayName || res.user.email?.split('@')[0] || 'User',
          email: res.user.email,
          photoURL: res.user.photoURL,
          isGuest: false,
        };
        onUpdateUser(u);
        setDisplayName(u.displayName || 'User');
        setPhotoURL(u.photoURL || '');
      }
    } catch (e) {
      console.error('Google Sign In failed:', e);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onUpdateUser(null);
      localStorage.removeItem('gyaanx_user_profile_v2');
      onClose();
      if (onRequireLogin) {
        onRequireLogin();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const gyaanxModels = [
    {
      id: 'gemini-3.1-flash-lite',
      title: 'GyaanX Turbo',
      desc: 'High-speed daily conversational intelligence',
      badge: 'Fastest',
      icon: <Zap size={16} className="text-emerald-400" />,
    },
    {
      id: 'gemini-3.8-flash',
      title: 'GyaanX Flash',
      desc: 'Multimodal vision and detailed comprehension',
      badge: 'Smart',
      icon: <Sparkles size={16} className="text-blue-400" />,
    },
    {
      id: 'gemini-3.1-pro-preview',
      title: 'GyaanX Pro',
      desc: 'Advanced logic, complex math & code generation',
      badge: 'Pro',
      icon: <Cpu size={16} className="text-purple-400" />,
    },
    {
      id: 'gemini-flash-latest',
      title: 'GyaanX Core',
      desc: 'Auto-updating stable production engine',
      badge: 'Stable',
      icon: <Compass size={16} className="text-sky-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#080c14] text-slate-100 flex flex-col overflow-y-auto no-scrollbar animate-in fade-in duration-150">
      {/* ========================================================= */}
      {/* CLEAN HEADER                                              */}
      {/* ========================================================= */}
      <div className="sticky top-0 z-40 bg-[#080c14]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Back to chat"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight">Settings</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isSaved ? (
            <Check size={16} className="text-emerald-300" />
          ) : (
            <Save size={16} />
          )}
          <span>{isSaved ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* CLEAN SETTINGS BODY (NO FALTU GYAN)                        */}
      {/* ========================================================= */}
      <div className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 py-6 pb-20 space-y-5">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          accept="image/*"
          className="hidden"
        />

        {/* 1. ACCOUNT */}
        <div className="rounded-3xl bg-[#111827]/90 border border-white/10 p-5 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <UserIcon size={14} className="text-blue-400" />
            <span>Account</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative">
                <UserAvatar photoURL={photoURL} displayName={displayName} size={60} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-95 cursor-pointer"
                  title="Upload avatar"
                >
                  <Camera size={13} />
                </button>
              </div>

              <div className="min-w-0">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="font-semibold text-white bg-transparent border-b border-transparent hover:border-white/20 focus:border-blue-400 focus:outline-none text-base max-w-[180px] sm:max-w-xs transition-colors"
                />
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {currentUser?.email || 'Guest User'}
                </p>
              </div>
            </div>

            <div>
              {currentUser?.email ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-500/30 hover:bg-red-500/10 text-red-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Sign out</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  <span>Sign in</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. GYAANX AI ENGINE SELECTION */}
        <div className="rounded-3xl bg-[#111827]/90 border border-white/10 p-5 backdrop-blur-md shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Cpu size={14} className="text-purple-400" />
            <span>AI Model Engine</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {gyaanxModels.map((m) => {
              const isSelected = selectedModel === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModel(m.id)}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500/50 text-white'
                      : 'bg-black/30 border-white/5 hover:border-white/15 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {m.icon}
                      <span className="font-semibold text-sm">{m.title}</span>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 size={16} className="text-blue-400" />
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">{m.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. TONE & INSTRUCTIONS */}
        <div className="rounded-3xl bg-[#111827]/90 border border-white/10 p-5 backdrop-blur-md shadow-xl space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tone & Instructions
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                { id: 'hinglish', label: 'Desi Hinglish' },
                { id: 'balanced', label: 'English' },
                { id: 'concise', label: 'Concise' },
                { id: 'creative', label: 'Creative' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id)}
                className={`py-2 px-2.5 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer ${
                  tone === t.id
                    ? 'bg-blue-500/20 border-blue-400/50 text-white'
                    : 'bg-black/30 border-white/5 hover:bg-white/5 text-slate-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <textarea
            rows={3}
            value={systemInstruction}
            onChange={(e) => setSystemInstruction(e.target.value)}
            placeholder="Custom instructions (e.g. Always keep answers concise and friendly)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-400 leading-relaxed resize-none no-scrollbar"
          />
        </div>

        {/* 4. PERSONAL API KEY (OPTIONAL) */}
        <div className="rounded-3xl bg-[#111827]/90 border border-white/10 p-5 backdrop-blur-md shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Key size={14} className="text-emerald-400" />
              <span>Personal API Key (Optional)</span>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline"
            >
              <span>Get key</span>
              <ExternalLink size={10} />
            </a>
          </div>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              placeholder="Paste key to bypass shared limits"
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-400 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowKey((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* 5. RESET CACHE */}
        <div className="rounded-3xl bg-[#111827]/90 border border-white/10 p-4 backdrop-blur-md shadow-xl flex items-center justify-between">
          <div>
            <h3 className="text-xs font-medium text-white">Reset Local Cache</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Clears temporary offline data</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (confirm('Clear temporary local storage cache?')) {
                localStorage.removeItem('gemini_daily_usage_stats_v1');
                alert('Local cache reset.');
              }
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-white/5 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <Trash2 size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
