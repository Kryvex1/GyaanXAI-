import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Plus,
  Mic,
  MicOff,
  Loader2,
  X,
  ShieldAlert,
} from 'lucide-react';
import { AttachedImage } from '../types.ts';
import { uploadToImgBB } from '../imgbb.ts';

interface ChatInputProps {
  onSendMessage: (content: string, image?: AttachedImage) => void;
  isStreaming: boolean;
  onStop: () => void;
  isLoggedIn?: boolean;
  onRequireLogin?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isStreaming,
  onStop,
}) => {
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Anti-Spam Rate Limiter (Protects website & API from spam bursts)
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const messageTimestampsRef = useRef<number[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Controlled, compact auto-resize: min 24px, max 76px (never oversized)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const clampedHeight = Math.min(Math.max(scrollHeight, 24), 76);
      textareaRef.current.style.height = `${clampedHeight}px`;
    }
  }, [input]);

  // Anti-spam countdown effect
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Voice Dictation (Speech Recognition)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN,en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const handleToggleMic = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds 15MB limit.');
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = (event) => {
          const result = event.target?.result as string;
          resolve(result.split(',')[1]);
        };
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      try {
        await uploadToImgBB(file, file.name);
      } catch (uploadErr) {
        console.warn('Fallback to local base64:', uploadErr);
      }

      setAttachedImage({
        data: base64Data,
        mimeType: file.type,
        name: file.name,
      });
    } catch (err: any) {
      console.error('File reading failed:', err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isStreaming) {
      onStop();
      return;
    }

    if (cooldownSeconds > 0) return;

    const trimmed = input.trim();
    if (!trimmed && !attachedImage) return;

    // Anti-Spam Check: Max 3 messages within 8 seconds
    const now = Date.now();
    const recent = messageTimestampsRef.current.filter((t) => now - t < 8000);
    if (recent.length >= 3) {
      setCooldownSeconds(8);
      return;
    }
    messageTimestampsRef.current = [...recent, now];

    onSendMessage(trimmed, attachedImage || undefined);
    setInput('');
    setAttachedImage(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isSpamBlocked = cooldownSeconds > 0;
  const canSubmit = (input.trim().length > 0 || !!attachedImage) && !isSpamBlocked;

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 pb-2 sm:pb-3 select-none">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
      />

      {/* Attached image preview badge */}
      {attachedImage && (
        <div className="mb-2 flex items-center gap-2">
          <div className="relative inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-2xl bg-[#111827] border border-blue-500/40 text-xs text-slate-200 shadow-lg animate-in fade-in duration-200">
            <img
              src={`data:${attachedImage.mimeType};base64,${attachedImage.data}`}
              alt="Upload preview"
              className="w-8 h-8 object-cover rounded-xl border border-white/20"
            />
            <span className="max-w-[150px] truncate text-[12px] font-medium text-slate-300">
              {attachedImage.name || 'Image'}
            </span>
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Remove image"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#111827] border border-blue-500/30 text-xs text-blue-300 shadow-md">
          <Loader2 size={13} className="animate-spin text-blue-400" />
          <span>Uploading photo...</span>
        </div>
      )}

      {/* Anti-Spam warning indicator badge if triggered */}
      {isSpamBlocked && (
        <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-300 shadow-md animate-in fade-in duration-150">
          <ShieldAlert size={13} className="text-amber-400 shrink-0" />
          <span>Anti-spam active: please wait {cooldownSeconds}s before sending again</span>
        </div>
      )}

      {/* ============================================================= */}
      {/* COMPACT & SLEEK INPUT CAPSULE (NO SEARCH BUTTON, NO SCROLLBAR) */}
      {/* ============================================================= */}
      <div className="relative rounded-[26px] bg-[#111827]/95 hover:bg-[#151f33] border border-white/10 hover:border-white/20 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/15 shadow-xl transition-all px-3 py-1.5 flex items-end gap-1.5 backdrop-blur-xl">
        {/* Plus (+) Button for Image Attachments */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 mb-0.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer shrink-0"
          title="Attach photo"
        >
          <Plus size={19} strokeWidth={2.2} />
        </button>

        {/* Text Input - Controlled Height, NO vertical scrollbar line */}
        <div className="flex-1 min-w-0 py-1.5 px-1 flex items-center">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isSpamBlocked ? `Spam cooldown (${cooldownSeconds}s)...` : "Ask GyaanX..."}
            rows={1}
            disabled={isSpamBlocked}
            className="w-full bg-transparent text-white placeholder-slate-400 text-[14.5px] sm:text-[15px] focus:outline-none resize-none leading-relaxed overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden disabled:opacity-50"
            style={{
              maxHeight: '76px',
              minHeight: '24px',
            }}
          />
        </div>

        {/* Action Button: Send / Stop / Mic */}
        <div className="mb-0.5 shrink-0 flex items-center">
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="p-2 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-md transition-transform active:scale-95 cursor-pointer flex items-center justify-center"
              title="Stop generating"
            >
              <Square size={13} fill="currentColor" />
            </button>
          ) : isSpamBlocked ? (
            <div
              className="p-2 rounded-full bg-slate-800 text-slate-500 cursor-not-allowed flex items-center justify-center text-xs font-mono"
              title={`Cooldown: ${cooldownSeconds}s`}
            >
              {cooldownSeconds}s
            </div>
          ) : canSubmit ? (
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="p-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/30 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
              title="Send message"
            >
              <ArrowUp size={17} strokeWidth={2.6} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleMic}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                isListening
                  ? 'text-red-400 bg-red-950/70 border border-red-500/40 animate-pulse'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title={isListening ? 'Listening...' : 'Voice dictation'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
