import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  CheckCheck,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Sparkles,
} from 'lucide-react';
import { Message } from '../types.ts';
import { GyaanXLogo } from './GyaanXLogo.tsx';
import { UserAvatar } from './UserAvatar.tsx';
import { formatMessageTime } from '../utils.ts';

interface ChatMessageProps {
  message: Message;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  userPhotoURL?: string | null;
  userName?: string | null;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLastAssistant,
  onRegenerate,
  userPhotoURL,
  userName,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isUser = message.role === 'user';
  const timeFormatted = formatMessageTime(message.timestamp);

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
  // USER BUBBLE (Shadcn Chat Bubble Pattern: Right-Aligned, Tail, Double Tick)
  // =========================================================================
  if (isUser) {
    return (
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 py-2.5 flex justify-end items-end gap-2.5 group animate-in fade-in duration-200">
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[76%] min-w-[70px]">
          {/* User Bubble Body */}
          <div className="relative rounded-2xl rounded-tr-xs bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-3 shadow-md shadow-blue-900/20 border border-blue-400/20 text-[14px] sm:text-[14.5px] leading-relaxed break-words transition-colors">
            {/* Attached Photo if any */}
            {message.image && (
              <div className="mb-2 relative rounded-xl overflow-hidden border border-white/20 bg-black/40 group/img shadow-md inline-block max-w-full">
                <img
                  src={
                    message.image.data.startsWith('http')
                      ? message.image.data
                      : `data:${message.image.mimeType};base64,${message.image.data}`
                  }
                  alt={message.image.name || 'User upload'}
                  className="max-h-60 max-w-full w-auto rounded-lg object-contain block"
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
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/75 hover:bg-black text-white backdrop-blur-xs opacity-0 group-hover/img:opacity-100 transition-all shadow-md cursor-pointer"
                  title="Download image"
                >
                  <Download size={13} />
                </button>
              </div>
            )}

            {/* User message content */}
            <p className="whitespace-pre-wrap">{message.content}</p>

            {/* Bubble Footer: Timestamp & Double Checkmarks (Shadcn style) */}
            <div className="flex items-center justify-end gap-1.5 mt-1.5 -mb-0.5 text-[11px] text-blue-100/75 select-none font-medium">
              <span>{timeFormatted}</span>
              <CheckCheck size={14} strokeWidth={2.4} className="text-blue-100" />
            </div>
          </div>
        </div>

        {/* User Avatar */}
        <UserAvatar
          photoURL={userPhotoURL}
          displayName={userName}
          size={32}
          className="mb-0.5 shrink-0 ring-2 ring-blue-500/20"
        />
      </div>
    );
  }

  // =========================================================================
  // ASSISTANT BUBBLE (Shadcn Chat Bubble Pattern: Left-Aligned, GyaanX Card)
  // =========================================================================
  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 py-2.5 flex items-start gap-2.5 sm:gap-3 group animate-in fade-in duration-200">
      {/* GyaanX Logo Avatar with ambient glow */}
      <div className="mt-0.5 shrink-0">
        <GyaanXLogo size={32} className="shadow-md shadow-blue-500/20 ring-2 ring-blue-500/10" />
      </div>

      <div className="flex-1 min-w-0 max-w-[94%] sm:max-w-[85%]">
        {/* Assistant Header: Name + Badge + Time */}
        <div className="flex items-center gap-2 mb-1.5 px-0.5 select-none">
          <span className="text-[13px] font-semibold text-white tracking-tight flex items-center gap-1">
            GyaanX AI
            <Sparkles size={11} className="text-blue-400" />
          </span>
          <span className="text-[11px] text-slate-500 font-normal">{timeFormatted}</span>
        </div>

        {/* Shadcn Assistant Bubble Container */}
        <div className="relative rounded-2xl rounded-tl-xs bg-[#0e1424] border border-[#1b253b] p-3.5 sm:p-4 shadow-lg text-slate-100 text-[14px] sm:text-[14.5px] leading-relaxed break-words space-y-3">
          {/* Attached/Referenced Photo */}
          {message.image && (
            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/50 group/img shadow-md max-w-sm">
              <img
                src={
                  message.image.data.startsWith('http')
                    ? message.image.data
                    : `data:${message.image.mimeType};base64,${message.image.data}`
                }
                alt={message.image.name || 'Image'}
                className="w-full max-h-72 object-cover rounded-lg"
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

          {/* Markdown Content */}
          <div className="prose prose-invert prose-slate max-w-none prose-p:leading-relaxed prose-p:my-1.5 prose-headings:my-2 prose-headings:font-bold prose-headings:text-white prose-ul:my-1.5 prose-li:my-0.5 text-slate-100">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <div className="my-2.5 rounded-xl overflow-hidden border border-slate-700/80 bg-[#060a12] shadow-sm">
                      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#0b101c] border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                        <span className="font-semibold text-slate-300">{match[1]}</span>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(String(children))}
                          className="hover:text-white flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 cursor-pointer"
                        >
                          <Copy size={11} />
                          <span>Copy code</span>
                        </button>
                      </div>
                      <pre className="p-3.5 overflow-x-auto text-[13px] font-mono leading-relaxed text-slate-200">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  ) : (
                    <code
                      className="px-1.5 py-0.5 rounded-md bg-slate-800/90 text-sky-300 font-mono text-[12.5px] border border-slate-700/50"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Streaming Cursor */}
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-blue-400 animate-pulse align-middle rounded-xs" />
          )}

          {/* Search Citations */}
          {message.sources && message.sources.length > 0 && (
            <div className="pt-2 border-t border-slate-800/60 mt-1 select-none">
              <span className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                Sources:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {message.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-[11.5px] text-sky-400 border border-slate-700/60 hover:border-sky-500/50 transition-all max-w-[220px] truncate"
                  >
                    <span className="truncate">{src.title || src.uri}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Shadcn Bubble Micro Action Bar */}
          <div className="flex items-center gap-1 pt-2 border-t border-slate-800/40 select-none">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Copy response"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>

            <button
              type="button"
              onClick={handleToggleSpeak}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isSpeaking
                  ? 'text-sky-400 bg-sky-950/60'
                  : 'hover:text-white hover:bg-slate-800 text-slate-400'
              }`}
              title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
            >
              {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>

            {isLastAssistant && onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
                title="Regenerate response"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
