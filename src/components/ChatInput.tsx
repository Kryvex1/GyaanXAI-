import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Image as ImageIcon,
  Paperclip,
  Mic,
  MicOff,
  Globe,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';
import { AttachedImage } from '../types.ts';
import { uploadToImgBB } from '../imgbb.ts';

interface ChatInputProps {
  onSendMessage: (content: string, image?: AttachedImage) => void;
  isStreaming: boolean;
  onStop: () => void;
  enableSearch: boolean;
  onToggleSearch: () => void;
  isLoggedIn?: boolean;
  onRequireLogin?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isStreaming,
  onStop,
  enableSearch,
  onToggleSearch,
}) => {
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea smoothly without jumping
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 26), 140)}px`;
    }
  }, [input]);

  // Voice Speech Recognition Setup
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

    const trimmed = input.trim();
    if (!trimmed && !attachedImage) return;

    onSendMessage(trimmed, attachedImage || undefined);
    setInput('');
    setAttachedImage(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = input.trim().length > 0 || !!attachedImage;

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 pb-3 sm:pb-4 pt-1 select-none">
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

      {/* ============================================================= */}
      {/* PREMIUM HIGH-FIDELITY CHAT INPUT CARD                         */}
      {/* ============================================================= */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-[#0e1424] border border-[#1b253b] hover:border-[#22314e] focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/15 shadow-2xl transition-all p-2.5 sm:p-3">
        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask GyaanX anything..."
          rows={1}
          className="w-full bg-transparent text-white placeholder-slate-500 text-[14px] sm:text-[15px] focus:outline-none resize-none px-2 pt-1 pb-2 leading-relaxed max-h-36"
        />

        {/* Bottom Action Bar inside input card */}
        <div className="flex items-center justify-between pt-1 border-t border-[#162035]/80">
          {/* Left Controls: Attach, Photos, Search, Voice */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#151f33] transition-colors cursor-pointer"
              title="Attach photo or image"
            >
              <Paperclip size={17} />
            </button>

            {/* Photo Gallery Icon */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#151f33] transition-colors cursor-pointer"
              title="Upload photo"
            >
              <ImageIcon size={17} />
            </button>

            {/* Web Search Pill */}
            <button
              type="button"
              onClick={onToggleSearch}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                enableSearch
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs shadow-sky-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#151f33] border border-transparent'
              }`}
              title={enableSearch ? 'Web Search active' : 'Enable Web Search'}
            >
              <Globe size={14} className={enableSearch ? 'text-sky-400' : 'text-slate-400'} />
              <span className="hidden sm:inline">Search</span>
            </button>

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={handleToggleMic}
              className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
                isListening
                  ? 'text-red-400 bg-red-950/70 border border-red-500/40 animate-pulse'
                  : 'text-slate-400 hover:text-white hover:bg-[#151f33]'
              }`}
              title={isListening ? 'Listening... click to stop' : 'Voice input'}
            >
              {isListening ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
          </div>

          {/* Right Action: Send or Stop Button */}
          <div className="flex items-center gap-2">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/40 transition-transform active:scale-95 cursor-pointer flex items-center justify-center"
                title="Stop generating"
              >
                <Square size={15} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!canSubmit}
                className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center ${
                  canSubmit
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 active:scale-95 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                }`}
                title="Send message (Enter)"
              >
                <ArrowUp size={16} strokeWidth={2.6} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
