import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  X,
  Settings,
  MoreVertical,
  Edit2,
  Trash2,
  ChevronDown,
  Check,
  MessageSquare,
  Image as ImageIcon,
} from 'lucide-react';
import { Conversation } from '../types.ts';
import { ConfirmModal } from './ConfirmModal.tsx';
import { UserAvatar } from './UserAvatar.tsx';
import { AppUser } from '../firebase.ts';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onClearAll: () => void;
  onOpenSettings: () => void;
  onOpenUsage: () => void;
  onOpenProfile: () => void;
  activeTab?: 'chats' | 'images';
  onSelectTab?: (tab: 'chats' | 'images') => void;
  currentUser: AppUser | null;
  tokensLeft?: number;
  isOpen: boolean;
  onToggleOpen: () => void;
  currentModel?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onOpenProfile,
  activeTab = 'chats',
  onSelectTab,
  currentUser,
  isOpen,
  onToggleOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close 3-dot menu on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [activeMenuId]);

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (c: Conversation) => {
    setActiveMenuId(null);
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const saveEditing = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggleOpen}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-[#0c101c] border-r border-white/10 flex flex-col transition-transform duration-200 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-72'
        }`}
      >
        {/* Top Header: Gemini Star + Brand + Close Button */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* 4-Point Gemini Colorful Star */}
            <svg viewBox="0 0 100 100" className="w-6 h-6">
              <defs>
                <linearGradient id="sidebarGeminiStar" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="35%" stopColor="#6366f1" />
                  <stop offset="70%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#fb923c" />
                </linearGradient>
              </defs>
              <path
                d="M50 0 C50 27.6 27.6 50 0 50 C27.6 50 50 72.4 50 100 C50 72.4 72.4 50 100 50 C72.4 50 50 27.6 50 0 Z"
                fill="url(#sidebarGeminiStar)"
              />
            </svg>
            <span className="font-semibold text-lg text-white tracking-tight">GyaanX</span>
          </div>

          <button
            type="button"
            onClick={onToggleOpen}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Top Segment Tabs: Chats & Images Gallery */}
        <div className="px-4 pb-3">
          <div className="flex items-center p-1 rounded-full bg-white/5 border border-white/10 gap-1">
            <button
              type="button"
              onClick={() => {
                if (onSelectTab) onSelectTab('chats');
              }}
              className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 text-center text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer ${
                activeTab === 'chats'
                  ? 'text-white bg-white/15 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageSquare size={13} className={activeTab === 'chats' ? 'text-blue-400' : 'text-slate-400'} />
              <span>Chats</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onSelectTab) onSelectTab('images');
                if (window.innerWidth < 1024) onToggleOpen();
              }}
              className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 text-center text-xs font-semibold rounded-full transition-all duration-200 active:scale-95 cursor-pointer ${
                activeTab === 'images'
                  ? 'text-white bg-white/15 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="View uploaded images"
            >
              <ImageIcon size={13} className={activeTab === 'images' ? 'text-indigo-400' : 'text-slate-400'} />
              <span>Images</span>
            </button>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="px-4 space-y-2 pb-3">
          {/* New Chat Button (Pill matching screenshot) */}
          <button
            type="button"
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onToggleOpen();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-all active:scale-[0.98] cursor-pointer border border-white/10 shadow-sm"
          >
            <Plus size={18} strokeWidth={2.4} />
            <span>New chat</span>
          </button>

          {/* Search Chats Button */}
          {!isSearching ? (
            <button
              type="button"
              onClick={() => setIsSearching(true)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-slate-300 hover:text-white hover:bg-white/5 font-medium text-sm transition-colors cursor-pointer"
            >
              <Search size={18} />
              <span>Search chats</span>
            </button>
          ) : (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-2 bg-white/5 border border-white/15 rounded-full text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearching(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Recent Chats Section Header */}
        <div className="px-5 py-2 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <span>Recent</span>
          <ChevronDown size={14} />
        </div>

        {/* Conversation List */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2 space-y-0.5">
          {filteredConversations.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              {searchQuery ? 'No matching chats' : 'No chats yet'}
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = c.id === activeId;
              const isEditing = editingId === c.id;

              return (
                <div key={c.id} className="relative group">
                  <div
                    onClick={() => {
                      onSelectConversation(c.id);
                      if (window.innerWidth < 1024) onToggleOpen();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {isEditing ? (
                      <form
                        onSubmit={(e) => saveEditing(c.id, e)}
                        className="flex-1 flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                          className="flex-1 bg-black/50 border border-blue-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                        />
                        <button type="submit" className="p-1 text-emerald-400 hover:text-emerald-300">
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      </form>
                    ) : (
                      <>
                        <span className="truncate pr-2">{c.title || 'New conversation'}</span>

                        {/* 3-Dots Menu Trigger matching Gemini screenshot */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === c.id ? null : c.id);
                          }}
                          className={`p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 ${
                            isActive || activeMenuId === c.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                          title="Chat options"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* 3-Dots Dropdown Menu */}
                  {activeMenuId === c.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-2 top-full mt-1 w-36 rounded-xl bg-[#141b2b] border border-white/15 shadow-2xl z-50 p-1 animate-in fade-in zoom-in-95 backdrop-blur-md"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => startEditing(c)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Edit2 size={13} />
                        <span>Rename</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          setConversationToDelete(c);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom User Account Card matching Screenshot_20260925_142051.jpg */}
        <div className="p-3 border-t border-white/10">
          <div
            onClick={onOpenProfile}
            className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <UserAvatar
                photoURL={currentUser?.photoURL}
                displayName={currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                size={36}
                className="ring-2 ring-white/10 shrink-0"
              />
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-sm font-semibold text-white tracking-tight truncate group-hover:text-blue-300 transition-colors">
                  {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                </span>
                <span className="text-xs text-slate-400">Online</span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenProfile();
              }}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Account & Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Delete Single Conversation Modal */}
      <ConfirmModal
        isOpen={!!conversationToDelete}
        title="Delete Conversation"
        message={`Delete "${conversationToDelete?.title || 'this conversation'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (conversationToDelete) {
            onDeleteConversation(conversationToDelete.id);
            setConversationToDelete(null);
          }
        }}
        onCancel={() => setConversationToDelete(null)}
      />
    </>
  );
};
