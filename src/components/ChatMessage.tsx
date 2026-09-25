import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  ExternalLink,
  AlertCircle,
  Key,
  Zap,
  Sparkles,
} from 'lucide-react';
import { Message } from '../types.ts';
import { AgentAvatar } from './AgentAvatar.tsx';

interface ChatMessageProps {
  message: Message;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  onSwitchModelAndRetry?: (modelId: string) => void;
  userPhotoURL?: string | null;
  userName?: string | null;
  onOpenProfile?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLastAssistant,
  onRegenerate,
  onSwitchModelAndRetry,
  onOpenProfile,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (data: string, mimeType: string, filename = 'gyaanx-photo.png') => {
    const link = document.createElement('a');
    if (data.startsWith('http://') || data.startsWith('https://')) {
      link.href = data;
    } else {
      link.href = `data:${mimeType};base64,${data}`;
    }
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = message.content.replace(/[*_#`[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // =========================================================================
  // USER PROMPT (Clean, Sleek Modern AI Style)
  // =========================================================================
  if (isUser) {
    const hasImage = Boolean(message.image?.data);
    const hasText = Boolean(message.content && message.content.trim().length > 0);

    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-2.5 flex justify-end group animate-in fade-in duration-150">
        <div
          className={`max-w-[88%] sm:max-w-[78%] rounded-2xl bg-[#1e2536] hover:bg-[#232b3e] text-slate-100 shadow-sm border border-white/5 text-[15px] leading-relaxed break-words transition-colors ${
            hasImage ? 'p-2' : 'px-4.5 py-3'
          }`}
        >
          {/* Attached Photo if any - tight clean 8-12px padding, no double bulky container */}
          {hasImage && (
            <div className="relative group/img rounded-xl overflow-hidden inline-block max-w-full">
              <img
                src={
                  message.image!.data.startsWith('http')
                    ? message.image!.data
                    : `data:${message.image!.mimeType};base64,${message.image!.data}`
                }
                alt={message.image!.name || 'User upload'}
                className="max-h-80 sm:max-h-96 w-auto max-w-full rounded-xl object-contain block"
              />
              <button
                type="button"
                onClick={() =>
                  handleDownload(
                    message.image!.data,
                    message.image!.mimeType,
                    message.image!.name || 'upload.png'
                  )
                }
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/75 hover:bg-black text-white backdrop-blur-xs opacity-0 group-hover/img:opacity-100 transition-all shadow-md cursor-pointer active:scale-95"
                title="Download image"
              >
                <Download size={13} />
              </button>
            </div>
          )}

          {/* User Prompt Text */}
          {hasText && (
            <p
              className={`whitespace-pre-wrap select-text ${
                hasImage ? 'px-1.5 pt-2 pb-1 text-[14.5px]' : ''
              }`}
            >
              {message.content}
            </p>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // ASSISTANT THINKING STATE (Subtle Gemini Sparkle shimmer, no giant blur)
  // =========================================================================
  if (message.isStreaming && !message.content) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3.5 group animate-in fade-in duration-200">
        <AgentAvatar size={26} isThinking={true} />
        <span className="text-sm font-medium text-slate-300 animate-pulse">
          Thinking...
        </span>
      </div>
    );
  }

  // =========================================================================
  // ASSISTANT RESPONSE (Clean Gemini Floating Typography + Normal Star Logo)
  // =========================================================================
  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-3.5 flex items-start gap-3.5 sm:gap-4 group animate-in fade-in duration-150">
      {/* Gemini 4-Point Star Logo (Normal SVG, subtle spin while streaming) */}
      <div className="mt-1 shrink-0">
        <AgentAvatar size={24} isThinking={message.isStreaming} />
      </div>

      <div className="flex-1 min-w-0">
        {/* If message is an error (e.g. rate limit), show clean alert with Model Switch and Add Key triggers */}
        {message.isError ? (
          <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/25 text-slate-200 text-sm space-y-3.5 backdrop-blur-md shadow-lg">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                {message.content.replace(/^⚠️ Error:\s*/, '')}
              </div>
            </div>

            {/* Quick Switch Alternative Models */}
            {onSwitchModelAndRetry && (
              <div className="pt-2 border-t border-amber-500/15 space-y-2">
                <span className="text-[11.5px] font-medium text-amber-300/90 block">
                  ⚡ Switch to an alternate GyaanX model & retry:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onSwitchModelAndRetry('gemini-3.1-flash-lite')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/45 text-blue-200 border border-blue-500/30 text-xs font-medium transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    <Zap size={12} className="text-blue-400" />
                    <span>Switch to GyaanX Turbo & Retry</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSwitchModelAndRetry('gemini-2.5-flash')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/45 text-indigo-200 border border-indigo-500/30 text-xs font-medium transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    <Sparkles size={12} className="text-indigo-400" />
                    <span>Switch to GyaanX Flash & Retry</span>
                  </button>
                </div>
              </div>
            )}

            {onOpenProfile && (
              <div className="pt-2 border-t border-amber-500/15 flex items-center justify-between">
                <span className="text-xs text-slate-400">Want unlimited high speed?</span>
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Key size={13} />
                  <span>Add Personal API Key</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Gemini Content: Seamless, High-Contrast Typography */
          <div className="text-slate-100 text-[15px] sm:text-[15.5px] leading-relaxed break-words space-y-3">
          {/* Attached/Referenced Photo */}
          {message.image && (
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 group/img shadow-md max-w-sm">
              <img
                src={
                  message.image.data.startsWith('http')
                    ? message.image.data
                    : `data:${message.image.mimeType};base64,${message.image.data}`
                }
                alt={message.image.name || 'Image'}
                className="w-full max-h-72 object-cover rounded-xl"
              />
              <button
                type="button"
                onClick={() =>
                  handleDownload(
                    message.image!.data,
                    message.image!.mimeType,
                    message.image!.name || 'gyaanx-photo.png'
                  )
                }
                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white backdrop-blur-xs transition-all shadow-md cursor-pointer"
                title="Download image"
              >
                <Download size={14} />
              </button>
            </div>
          )}

          {/* Markdown Content with World-Class Structured Typography */}
          <div className="prose prose-invert max-w-none text-slate-100 font-normal leading-[1.8] text-[15px] sm:text-[15.5px] prose-p:my-3.5 prose-p:leading-[1.8] prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-white prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-h1:mt-6 prose-h2:mt-5 prose-h3:mt-4 prose-h1:mb-3 prose-h2:mb-2.5 prose-h3:mb-2 prose-ul:my-3 prose-ul:space-y-1.5 prose-ol:my-3 prose-ol:space-y-1.5 prose-li:my-0.5 prose-li:leading-relaxed prose-strong:text-white prose-strong:font-semibold prose-blockquote:border-l-2 prose-blockquote:border-blue-500/60 prose-blockquote:bg-blue-500/[0.04] prose-blockquote:rounded-r-xl prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:my-4 prose-blockquote:text-slate-300 prose-blockquote:italic">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <div className="my-4 rounded-2xl overflow-hidden border border-white/10 bg-[#080d1a] shadow-md">
                      <div className="flex items-center justify-between px-4 py-2 bg-[#0d1424] border-b border-white/5 text-[12px] text-slate-400 font-mono">
                        <span className="font-semibold text-slate-300 uppercase tracking-wider">{match[1]}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
                        >
                          <Copy size={12} />
                          <span>Copy code</span>
                        </button>
                      </div>
                      <pre className="p-4 text-[13.5px] font-mono overflow-x-auto text-slate-200 leading-relaxed">
                        <code>{children}</code>
                      </pre>
                    </div>
                  ) : (
                    <code
                      className="px-1.5 py-0.5 rounded-md bg-white/10 text-blue-300 font-mono text-[13px] font-medium"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                table({ children }: any) {
                  return (
                    <div className="my-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
                      <table className="w-full text-left border-collapse text-sm">
                        {children}
                      </table>
                    </div>
                  );
                },
                th({ children }: any) {
                  return (
                    <th className="p-3 border-b border-white/10 bg-white/[0.04] font-semibold text-white">
                      {children}
                    </th>
                  );
                },
                td({ children }: any) {
                  return (
                    <td className="p-3 border-b border-white/5 text-slate-200">
                      {children}
                    </td>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Search Grounding Sources if any */}
          {message.sources && message.sources.length > 0 && (
            <div className="pt-2 border-t border-white/5">
              <div className="flex flex-wrap gap-2">
                {message.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink size={11} />
                    <span className="truncate max-w-[200px]">{src.title || src.uri}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Gemini Minimal Actions Bar (Copy, Speak, Regenerate) */}
        {!message.isStreaming && (
          <div className="flex items-center gap-1 pt-2.5 text-slate-400 select-none">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Copy answer"
            >
              {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
            </button>

            <button
              type="button"
              onClick={handleToggleSpeak}
              className={`p-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${
                isSpeaking ? 'text-blue-400' : ''
              }`}
              title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
            >
              {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            {isLastAssistant && onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="p-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Regenerate response"
              >
                <RotateCcw size={15} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
