import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Compass,
  FileText,
  Wrench,
  Crown,
  ChevronRight,
  PanelLeftClose,
  SlidersHorizontal,
  BarChart3,
  Zap,
} from 'lucide-react';
import { Conversation } from '../types.ts';
import { ConfirmModal } from './ConfirmModal.tsx';
import { GyaanXLogo } from './GyaanXLogo.tsx';
import { formatConversationTime } from '../utils.ts';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onClearAll: () => void;
  onOpenSettings: () => void;
  onOpenUsage: () => void;
  onOpenProMode?: () => void;
  onOpenExplore?: () => void;
  onOpenPrompts?: () => void;
  onOpenTools?: () => void;
  tokensLeft: number;
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
  onClearAll,
  onOpenSettings,
  onOpenUsage,
  onOpenProMode,
  onOpenExplore,
  onOpenPrompts,
  onOpenTools,
  tokensLeft,
  isOpen,
  onToggleOpen,
  currentModel = 'gemini-2.5-flash',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'explore' | 'prompts' | 'tools'>('chats');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const modelDisplayName =
    currentModel === 'gemini-2.5-flash'
      ? 'GyaanX Flash'
      : currentModel === 'gemini-3.1-flash-lite'
      ? 'GyaanX Flash Lite'
      : 'GyaanX Pro';

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
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-[#090d18] border-r border-[#151c2e] flex flex-col transition-transform duration-200 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-72'
        }`}
      >
        {/* Brand Header with User's Uploaded Logo */}
        <div className="p-3.5 flex items-center justify-between border-b border-[#141b2c]">
          <div className="flex items-center gap-2.5 min-w-0">
            <GyaanXLogo size={34} />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[14.5px] text-white tracking-tight">GyaanX AI</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 shrink-0" />
              </div>
              <span className="text-[11px] text-slate-400 truncate">
                Online • {modelDisplayName}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleOpen}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title="Close sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* Action Button: + New Chat (Royal Vibrant Blue) */}
        <div className="p-3 pb-2 space-y-2.5">
          <button
            type="button"
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-[#2b70f7] hover:from-blue-500 hover:to-blue-600 text-white font-medium text-[13.5px] shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.6} />
            <span>New Chat</span>
          </button>

          {/* Navigation Items (Chats, Explore, Prompts, Tools) */}
          <nav className="space-y-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('chats')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeTab === 'chats'
                  ? 'bg-[#151f33] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#101726]'
              }`}
            >
              <MessageSquare size={16} className={activeTab === 'chats' ? 'text-blue-400' : 'text-slate-400'} />
              <span>Chats</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('explore');
                if (onOpenExplore) onOpenExplore();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeTab === 'explore'
                  ? 'bg-[#151f33] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#101726]'
              }`}
            >
              <Compass size={16} className={activeTab === 'explore' ? 'text-blue-400' : 'text-slate-400'} />
              <span>Explore</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('prompts');
                if (onOpenPrompts) onOpenPrompts();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeTab === 'prompts'
                  ? 'bg-[#151f33] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#101726]'
              }`}
            >
              <FileText size={16} className={activeTab === 'prompts' ? 'text-blue-400' : 'text-slate-400'} />
              <span>Prompts</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('tools');
                if (onOpenTools) onOpenTools();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeTab === 'tools'
                  ? 'bg-[#151f33] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#101726]'
              }`}
            >
              <Wrench size={16} className={activeTab === 'tools' ? 'text-blue-400' : 'text-slate-400'} />
              <span>Tools</span>
            </button>
          </nav>
        </div>

        {/* Search bar inside sidebar */}
        <div className="px-3 py-1">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#0e1424] border border-[#1a2338] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Recent Chats Section Heading */}
        <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
          <span className="text-[11.5px] font-medium text-slate-400">Recent Chats</span>
          {conversations.length > 1 && (
            <button
              type="button"
              onClick={() => setShowClearAllConfirm(true)}
              className="text-[10.5px] text-slate-500 hover:text-red-400 transition-colors"
              title="Clear all chats"
            >
              Clear
            </button>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {filteredConversations.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-slate-500">
              No conversations found
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = c.id === activeId;
              const isEditing = editingId === c.id;
              const timeDisplay = formatConversationTime(c.updatedAt || c.createdAt);

              return (
                <div
                  key={c.id}
                  onClick={() => onSelectConversation(c.id)}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#151f33] text-white font-medium shadow-xs border border-blue-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-[#0e1526]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
                    <MessageSquare
                      size={14}
                      className={`shrink-0 ${
                        isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-400'
                      }`}
                    />

                    {isEditing ? (
                      <form
                        onSubmit={(e) => saveEditing(c.id, e)}
                        className="flex items-center gap-1 flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                          className="w-full bg-slate-950 text-white px-1.5 py-0.5 rounded border border-slate-700 text-xs focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1 text-slate-400 hover:text-slate-200"
                        >
                          <X size={12} />
                        </button>
                      </form>
                    ) : (
                      <span className="truncate">{c.title}</span>
                    )}
                  </div>

                  {/* Right side: Timestamp + Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!isEditing && (
                      <span className="text-[10px] text-slate-500 group-hover:hidden group-focus-within:hidden">
                        {timeDisplay}
                      </span>
                    )}

                    {!isEditing && (
                      <div
                        className={`items-center gap-0.5 shrink-0 ${
                          isActive ? 'flex' : 'hidden group-hover:flex group-focus-within:flex'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => startEditing(c, e)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                          title="Rename chat"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConversationToDelete(c);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800"
                          title="Delete chat"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Area: User Daily Activity & Usage Status */}
        <div className="p-3 border-t border-[#141b2c] space-y-2">
          {/* Daily Usage Status */}
          <button
            type="button"
            onClick={onOpenUsage}
            className="w-full p-2.5 rounded-xl bg-[#0e1424] hover:bg-[#12192c] border border-[#1b253b] hover:border-slate-700 transition-all text-left group cursor-pointer"
            title="View daily token usage and quota status"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-slate-300 group-hover:text-white flex items-center gap-1.5">
                <BarChart3 size={13} className="text-blue-400" />
                Daily Usage & Quota
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                {tokensLeft > 1000000 ? `${(tokensLeft / 1000000).toFixed(1)}M` : `${Math.round(tokensLeft / 1000)}k`} left
              </span>
            </div>
            <div className="text-[10px] text-slate-500 flex items-center justify-between">
              <span>Usage status</span>
              <span className="text-blue-400 group-hover:underline">Details &rarr;</span>
            </div>
          </button>

          {/* Model Status & Settings Trigger */}
          <div className="flex items-center justify-between px-1 pt-0.5">
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 text-left hover:opacity-80 transition-opacity"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-400 font-medium">
                {modelDisplayName}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Settings"
            >
              <SlidersHorizontal size={14} />
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

      {/* Clear All Modal */}
      <ConfirmModal
        isOpen={showClearAllConfirm}
        title="Clear All Conversations"
        message="Are you sure you want to delete all chat history? A fresh conversation will be started."
        confirmLabel="Clear All"
        onConfirm={() => {
          setShowClearAllConfirm(false);
          onClearAll();
        }}
        onCancel={() => setShowClearAllConfirm(false)}
      />
    </>
  );
};
