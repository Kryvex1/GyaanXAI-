import React, { useState, useMemo } from 'react';
import {
  Image as ImageIcon,
  Download,
  ExternalLink,
  Search,
  MessageSquare,
  ArrowLeft,
  X,
} from 'lucide-react';
import { Conversation } from '../types.ts';

export interface GalleryItem {
  id: string;
  url: string;
  name?: string;
  mimeType: string;
  timestamp: number;
  conversationId: string;
  conversationTitle: string;
}

interface ImagesGalleryPageProps {
  conversations: Conversation[];
  onOpenConversation: (convId: string) => void;
  onBackToChat: () => void;
  onToggleSidebar?: () => void;
}

export const ImagesGalleryPage: React.FC<ImagesGalleryPageProps> = ({
  conversations,
  onOpenConversation,
  onBackToChat,
  onToggleSidebar,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreview, setSelectedPreview] = useState<GalleryItem | null>(null);

  // Extract all uploaded images across all chats
  const allImages = useMemo(() => {
    const collected: GalleryItem[] = [];
    conversations.forEach((conv) => {
      (conv.messages || []).forEach((msg) => {
        if (msg.image && msg.image.data) {
          const rawData = msg.image.data;
          const fullUrl = rawData.startsWith('http')
            ? rawData
            : rawData.startsWith('data:')
            ? rawData
            : `data:${msg.image.mimeType || 'image/png'};base64,${rawData}`;

          collected.push({
            id: `${conv.id}_${msg.id}`,
            url: fullUrl,
            name: msg.image.name || 'Uploaded Image',
            mimeType: msg.image.mimeType || 'image/png',
            timestamp: msg.timestamp || conv.updatedAt || Date.now(),
            conversationId: conv.id,
            conversationTitle: conv.title || 'Chat',
          });
        }
      });
    });

    return collected.sort((a, b) => b.timestamp - a.timestamp);
  }, [conversations]);

  const filteredImages = useMemo(() => {
    if (!searchQuery.trim()) return allImages;
    const q = searchQuery.toLowerCase();
    return allImages.filter(
      (img) =>
        (img.name || '').toLowerCase().includes(q) ||
        img.conversationTitle.toLowerCase().includes(q)
    );
  }, [allImages, searchQuery]);

  const handleDownload = (img: GalleryItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const link = document.createElement('a');
    link.href = img.url;
    link.download = img.name || `gyaanx-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#080c14] text-slate-100 overflow-hidden select-none">
      {/* Top Header with Safe Area Inset Support */}
      <header className="px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 bg-[#080c14]/90 backdrop-blur-xl border-b border-white/5 z-20 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="lg:hidden p-2 -ml-1 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
                title="Toggle sidebar"
              >
                <div className="w-5 flex flex-col gap-1.5 py-0.5">
                  <span className="w-5 h-[2px] bg-slate-300 rounded-full" />
                  <span className="w-5 h-[2px] bg-slate-300 rounded-full" />
                </div>
              </button>
            )}

            <button
              type="button"
              onClick={onBackToChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium border border-white/10 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-white">
                Photos
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {allImages.length}
              </span>
            </div>
          </div>

          {/* Mobile-only Search Button or inline search */}
          {allImages.length > 0 && (
            <div className="sm:hidden relative w-36">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          )}
        </div>

        {/* Desktop Search */}
        {allImages.length > 0 && (
          <div className="hidden sm:block relative w-48 md:w-64">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search uploaded images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
        )}
      </header>

      {/* Main Full-Page Gallery Feed */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 pb-16 no-scrollbar">
        {allImages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
              <ImageIcon size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-200">No images uploaded yet</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Photos attached in your chats will automatically be saved and organized here.
              </p>
            </div>
            <button
              type="button"
              onClick={onBackToChat}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <MessageSquare size={13} />
              <span>Start a Chat</span>
            </button>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            No images matching "{searchQuery}"
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 animate-in fade-in">
            {filteredImages.map((img) => (
              <div
                key={img.id}
                onClick={() => setSelectedPreview(img)}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-black/40 border border-white/10 hover:border-blue-500/40 transition-all duration-300 shadow-xs hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col"
              >
                <img
                  src={img.url}
                  alt={img.name || 'Image'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Dark Vignette Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2.5">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => handleDownload(img, e)}
                      className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white backdrop-blur-xs transition-all active:scale-95"
                      title="Download"
                    >
                      <Download size={13} />
                    </button>
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-white truncate drop-shadow-sm">
                      {img.conversationTitle}
                    </p>
                    <p className="text-[10px] text-slate-300">
                      {new Date(img.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Lightbox Modal */}
      {selectedPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 backdrop-blur-md"
          onClick={() => setSelectedPreview(null)}
        >
          {/* Top Control Bar */}
          <div
            className="absolute top-0 inset-x-0 p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))] flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-white min-w-0 mr-2">
              <h3 className="text-xs sm:text-sm font-semibold truncate">{selectedPreview.conversationTitle}</h3>
              <p className="text-[10px] sm:text-xs text-slate-400">
                {new Date(selectedPreview.timestamp).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDownload(selectedPreview)}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all active:scale-95 cursor-pointer"
              >
                <Download size={13} />
                <span className="hidden sm:inline">Download</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenConversation(selectedPreview.conversationId);
                  setSelectedPreview(null);
                }}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <ExternalLink size={13} />
                <span>Chat</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPreview(null)}
                className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Centered Large Image */}
          <img
            src={selectedPreview.url}
            alt={selectedPreview.name || 'Preview'}
            className="max-w-full max-h-[78vh] sm:max-h-[82vh] object-contain rounded-2xl shadow-2xl mt-8"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
