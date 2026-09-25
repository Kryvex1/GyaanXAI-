/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  PanelLeft,
  Settings,
  Plus,
  Trash2,
  Sparkles,
  Search,
  Moon,
  SlidersHorizontal,
  SquarePen,
  LogIn,
} from 'lucide-react';
import {
  Conversation,
  Message,
  AttachedImage,
  ChatSettings,
  ToneType,
  DailyUsageStats,
  TokenUsage,
} from './types.ts';
import { Sidebar } from './components/Sidebar.tsx';
import { ChatMessage } from './components/ChatMessage.tsx';
import { ChatInput } from './components/ChatInput.tsx';
import { EmptyState } from './components/EmptyState.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { UsageModal } from './components/UsageModal.tsx';
import { ConfirmModal } from './components/ConfirmModal.tsx';
import { QuickModal } from './components/QuickModals.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ProModeModal } from './components/ProModeModal.tsx';
import { GyaanXLogo } from './components/GyaanXLogo.tsx';
import { UserAvatar } from './components/UserAvatar.tsx';
import {
  auth,
  onAuthStateChanged,
  AppUser,
  getStoredUser,
  saveStoredUser,
  fetchUserConversationsFromCloud,
  saveUserConversationToCloud,
  deleteUserConversationFromCloud,
  clearAllUserConversationsFromCloud,
  saveUserDailyQuotaToCloud,
  fetchUserDailyQuotaFromCloud,
} from './firebase.ts';
import { loadDailyStats, recordUsage, MODEL_QUOTA_SPECS, getTodayKey } from './quotaUtils.ts';
import { checkAbuseAndRateLimit, recordDeviceUsage } from './antiAbuse.ts';
import { detectUserRegionAndTone } from './utils.ts';
import { SAMPLE_MATRIX_POSTER_SVG } from './samplePoster.ts';

const STORAGE_KEY = 'gyaanx_chat_conversations_v4';
const SETTINGS_KEY = 'gyaanx_chat_settings_v4';

function getDefaultConversations(): Conversation[] {
  const now = Date.now();
  const c1Id = 'c-ye-dekho-bro';

  const sampleBase64 = SAMPLE_MATRIX_POSTER_SVG.replace('data:image/svg+xml;utf8,', '');

  const c1: Conversation = {
    id: c1Id,
    title: 'Ye dekho bro',
    createdAt: now - 1000 * 60 * 15,
    updatedAt: now - 1000 * 60 * 15,
    messages: [
      {
        id: 'msg-u1',
        role: 'user',
        content: 'Ye dekho bro',
        timestamp: now - 1000 * 60 * 15,
        image: {
          data: encodeURIComponent(sampleBase64),
          mimeType: 'image/svg+xml',
          name: 'matrix_hacker_poster.svg',
        },
      },
      {
        id: 'msg-a1',
        role: 'assistant',
        content: `Are bhai! Kya killer pic bheji hai tune! 🤣
Ye toh seedha 'Matrix Reloaded' ka poster lag raha hai, but apna desi version, ekdum swag waala! 😼

Chal dekhte hain kya-kya hai is awesome pic mein:

🖼️ **Background** – Matrix jaisa green code rain
🎩 **Look** – Mysterious aur dangerous vibe
⚙️ **Style** – Desi hacker / underground
⚡ **Mood** – Calm + Attitude
⭐ **Overall** – Poster level edit! 🔥`,
        timestamp: now - 1000 * 60 * 15,
        image: {
          data: encodeURIComponent(sampleBase64),
          mimeType: 'image/svg+xml',
          name: 'matrix_hacker_poster.svg',
        },
        usage: {
          promptTokens: 145,
          candidatesTokens: 82,
          totalTokens: 227,
          model: 'gemini-2.5-flash',
        },
      },
    ],
  };

  const c2: Conversation = {
    id: 'c-bhai-kya-chal',
    title: 'Bhai kya chal rha h...',
    createdAt: now - 1000 * 60 * 45,
    updatedAt: now - 1000 * 60 * 45,
    messages: [
      {
        id: 'msg-u2',
        role: 'user',
        content: 'Bhai kya chal rha h tech industry me?',
        timestamp: now - 1000 * 60 * 45,
      },
      {
        id: 'msg-a2',
        role: 'assistant',
        content: 'Bas bro, AI ka danka baj raha hai! Har roz naye models aur tools launch ho rahe hain. Tu bata kya build kar raha hai?',
        timestamp: now - 1000 * 60 * 45,
      },
    ],
  };

  const c3: Conversation = {
    id: 'c-website-design',
    title: 'Website Design',
    createdAt: now - 1000 * 60 * 120,
    updatedAt: now - 1000 * 60 * 120,
    messages: [],
  };

  const c4: Conversation = {
    id: 'c-anime-app',
    title: 'Anime App Idea',
    createdAt: now - 1000 * 60 * 60 * 24,
    updatedAt: now - 1000 * 60 * 60 * 24,
    messages: [],
  };

  const c5: Conversation = {
    id: 'c-code-fix',
    title: 'Code Fix',
    createdAt: now - 1000 * 60 * 60 * 26,
    updatedAt: now - 1000 * 60 * 60 * 26,
    messages: [],
  };

  const c6: Conversation = {
    id: 'c-server-problem',
    title: 'Server Problem',
    createdAt: now - 1000 * 60 * 60 * 24 * 4,
    updatedAt: now - 1000 * 60 * 60 * 24 * 4,
    messages: [],
  };

  return [c1, c2, c3, c4, c5, c6];
}

export default function App() {
  const { isIndia, tone: defaultTone } = detectUserRegionAndTone();

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProModeOpen, setIsProModeOpen] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return getDefaultConversations();
  });

  const [activeId, setActiveId] = useState<string>(() => {
    return conversations[0]?.id || 'c-ye-dekho-bro';
  });

  const [settings, setSettings] = useState<ChatSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          enableSearch: !!parsed.enableSearch,
          tone: parsed.tone || defaultTone,
          systemInstruction: parsed.systemInstruction || '',
          model: parsed.model || 'gemini-2.5-flash',
          customApiKey: parsed.customApiKey || '',
        };
      }
    } catch (e) {
      console.error(e);
    }
    return {
      enableSearch: false,
      tone: defaultTone,
      systemInstruction: '',
      model: 'gemini-2.5-flash',
      customApiKey: '',
    };
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUsageOpen, setIsUsageOpen] = useState(false);
  const [quickModal, setQuickModal] = useState<'explore' | 'prompts' | 'tools' | 'search' | null>(null);
  const [showClearCurrentModal, setShowClearCurrentModal] = useState(false);
  const [dailyStats, setDailyStats] = useState<DailyUsageStats>(() => loadDailyStats());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Listen to Firebase Auth state & sync cloud data across devices
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const user: AppUser = {
          uid: fbUser.uid,
          displayName: fbUser.displayName,
          email: fbUser.email,
          photoURL: fbUser.photoURL,
          isGuest: false,
        };
        setCurrentUser(user);
        saveStoredUser(user);

        // ☁️ Sync Cloud conversations from Firestore for this account
        try {
          const cloudConvs = await fetchUserConversationsFromCloud(fbUser.uid);
          if (cloudConvs && cloudConvs.length > 0) {
            setConversations(cloudConvs);
            setActiveId(cloudConvs[0].id);
          }
          const cloudQuota = await fetchUserDailyQuotaFromCloud(fbUser.uid, getTodayKey());
          if (cloudQuota) {
            setDailyStats(cloudQuota);
          }
        } catch (err) {
          console.warn('Failed to load user cloud data:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.error(e);
    }
  }, [conversations]);

  // Sync settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  // Responsive sidebar: start closed on small mobile screens
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeId) || conversations[0];

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeId]);

  // New Chat Logic: Prevent creating multiple empty conversations
  const handleNewChat = () => {
    if (isStreaming) {
      handleStop();
    }

    // 1. If currently active conversation is already empty, just keep it!
    if (activeConversation && activeConversation.messages.length === 0) {
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      return;
    }

    // 2. If an existing empty conversation is already present, switch to it!
    const existingEmpty = conversations.find((c) => c.messages.length === 0);
    if (existingEmpty) {
      setActiveId(existingEmpty.id);
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      return;
    }

    // 3. Otherwise create 1 clean fresh conversation
    const newId = crypto.randomUUID();
    const newConv: Conversation = {
      id: newId,
      title: 'New conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newId);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        const newId = crypto.randomUUID();
        const fresh: Conversation = {
          id: newId,
          title: 'New conversation',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
        };
        setActiveId(newId);
        return [fresh];
      }
      if (activeId === id) {
        setActiveId(filtered[0].id);
      }
      return filtered;
    });

    if (currentUser?.uid) {
      deleteUserConversationFromCloud(currentUser.uid, id);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, title: newTitle, updatedAt: Date.now() };
          if (currentUser?.uid) {
            saveUserConversationToCloud(currentUser.uid, updated);
          }
          return updated;
        }
        return c;
      })
    );
  };

  const handleClearAll = () => {
    const newId = crypto.randomUUID();
    const fresh: Conversation = {
      id: newId,
      title: 'New conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setConversations([fresh]);
    setActiveId(newId);

    if (currentUser?.uid) {
      clearAllUserConversationsFromCloud(currentUser.uid);
    }
  };

  const handleClearCurrentMessages = () => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, messages: [], updatedAt: Date.now() } : c
      )
    );
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleSendMessage = async (content: string, image?: AttachedImage) => {
    if (!content.trim() && !image) return;

    // Use current user or fallback to persistent guest session so messages ALWAYS send!
    let activeUser = currentUser;
    if (!activeUser) {
      const stored = getStoredUser();
      if (stored) {
        activeUser = stored;
        setCurrentUser(stored);
      } else {
        const guest: AppUser = {
          uid: `guest_${Date.now()}`,
          displayName: 'GyaanX Guest',
          email: 'guest@gyaanx.ai',
          photoURL: null,
          isGuest: true,
        };
        activeUser = guest;
        saveStoredUser(guest);
        setCurrentUser(guest);
      }
    }

    // 🛡️ Device & Account Anti-Abuse Rate-Limit check
    const abuseCheck = checkAbuseAndRateLimit(activeUser?.uid);
    if (!abuseCheck.allowed) {
      alert(abuseCheck.reason || 'Please wait a moment before sending another message.');
      return;
    }

    if (isStreaming) {
      handleStop();
    }

    const userMessageId = crypto.randomUUID();
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content,
      timestamp: Date.now(),
      image,
    };

    const assistantMessageId = crypto.randomUUID();
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    const isFirstMessage = !activeConversation || activeConversation.messages.length === 0;
    const computedTitle = isFirstMessage
      ? content.trim().slice(0, 32) || (image ? 'Photo Analysis' : 'New chat')
      : activeConversation?.title || 'Conversation';

    // Ensure conversation exists in state so message is NEVER lost
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === activeId);
      if (!exists) {
        const freshConv: Conversation = {
          id: activeId,
          title: computedTitle,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [userMessage, initialAssistantMessage],
        };
        return [freshConv, ...prev];
      }
      return prev.map((c) => {
        if (c.id === activeId) {
          return {
            ...c,
            title: computedTitle,
            updatedAt: Date.now(),
            messages: [...c.messages, userMessage, initialAssistantMessage],
          };
        }
        return c;
      });
    });

    setTimeout(() => scrollToBottom('smooth'), 50);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);

    try {
      const messagesForApi = [
        ...(activeConversation?.messages || []),
        userMessage,
      ].map((m) => ({
        role: m.role,
        content: m.content,
        image: m.image
          ? {
              data: m.image.data,
              mimeType: m.image.mimeType,
            }
          : undefined,
      }));

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.customApiKey ? { 'x-gemini-key': settings.customApiKey } : {}),
        },
        body: JSON.stringify({
          messages: messagesForApi,
          settings: {
            enableSearch: settings.enableSearch,
            tone: settings.tone,
            systemInstruction: settings.systemInstruction,
            model: settings.model || 'gemini-2.5-flash',
          },
          customApiKey: settings.customApiKey,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errMessage = `Server error (${response.status})`;
        try {
          const errData = await response.json();
          errMessage = errData.error || errMessage;
        } catch {
          // ignore
        }
        throw new Error(errMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream from server.');

      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let sources: any[] = [];
      let finalUsage: TokenUsage | undefined;
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);

            if (data.error) {
              throw new Error(data.error);
            }

            if (data.text) {
              accumulatedText += data.text;
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === activeId) {
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMessageId
                          ? { ...m, content: accumulatedText }
                          : m
                      ),
                    };
                  }
                  return c;
                })
              );
              scrollToBottom('smooth');
            }

            if (data.sources) {
              sources = data.sources;
            }

            if (data.usage) {
              finalUsage = data.usage;
              const updated = recordUsage(data.usage);
              setDailyStats(updated);
              if (currentUser?.uid) {
                saveUserDailyQuotaToCloud(currentUser.uid, updated);
              }
              recordDeviceUsage(currentUser?.uid, data.usage.totalTokens || 0);
            }

            if (data.done) {
              break;
            }
          } catch (e: any) {
            console.error('Error parsing SSE event:', e);
          }
        }
      }

      // Finalize assistant message and sync to Firestore
      let finalConversationToSync: Conversation | null = null;
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeId) {
            const updated: Conversation = {
              ...c,
              updatedAt: Date.now(),
              messages: c.messages.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: accumulatedText || 'Koi response generate nahi hua.',
                      sources: sources.length > 0 ? sources : undefined,
                      usage: finalUsage,
                      isStreaming: false,
                    }
                  : m
              ),
            };
            finalConversationToSync = updated;
            return updated;
          }
          return c;
        })
      );

      if (currentUser?.uid && finalConversationToSync) {
        saveUserConversationToCloud(currentUser.uid, finalConversationToSync);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, isStreaming: false, content: m.content || '(Stopped)' }
                    : m
                ),
              };
            }
            return c;
          })
        );
      } else {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content: `⚠️ Error: ${err.message || 'Something went wrong.'}`,
                        isStreaming: false,
                        isError: true,
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = () => {
    if (!activeConversation || activeConversation.messages.length === 0) return;
    const lastUserIndex = [...activeConversation.messages]
      .reverse()
      .findIndex((m) => m.role === 'user');

    if (lastUserIndex === -1) return;
    const actualIndex = activeConversation.messages.length - 1 - lastUserIndex;
    const lastUserMessage = activeConversation.messages[actualIndex];

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeId) {
          return {
            ...c,
            messages: c.messages.slice(0, actualIndex + 1),
          };
        }
        return c;
      })
    );

    setTimeout(() => {
      handleSendMessage(lastUserMessage.content, lastUserMessage.image);
    }, 50);
  };

  const modelQuota = MODEL_QUOTA_SPECS[settings.model || 'gemini-2.5-flash'];
  const tokensRemaining = Math.max(0, modelQuota.tpd - dailyStats.totalTokensUsed);

  return (
    <div className="flex h-dvh max-h-dvh w-full bg-[#080c14] text-slate-100 overflow-hidden font-sans fixed inset-0">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => {
          setActiveId(id);
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onClearAll={handleClearAll}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenUsage={() => setIsUsageOpen(true)}
        onOpenProMode={() => setIsProModeOpen(true)}
        onOpenExplore={() => setQuickModal('explore')}
        onOpenPrompts={() => setQuickModal('prompts')}
        onOpenTools={() => setQuickModal('tools')}
        tokensLeft={tokensRemaining}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
        currentModel={settings.model}
      />

      {/* Main Chat Viewport */}
      <main className="flex-1 flex flex-col h-full min-h-0 bg-[#080c14] relative overflow-hidden">
        {/* TOP NAVBAR (PC & Mobile layouts) */}
        <header className="h-14 sm:h-16 border-b border-[#141b2c] bg-[#090d18]/90 backdrop-blur-md flex items-center justify-between px-3 sm:px-6 shrink-0 z-10 select-none">
          {/* MOBILE HEADER */}
          <div className="flex sm:hidden items-center justify-between w-full">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-1 text-slate-300 hover:text-white"
              title="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* Center Brand Title */}
            <div className="flex items-center gap-2">
              <GyaanXLogo size={28} />
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[13.5px] text-white tracking-tight">GyaanX AI</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
                </div>
                <span className="text-[10px] text-slate-400">
                  Online • GyaanX 2.0
                </span>
              </div>
            </div>

            {/* Mobile Actions: New Chat & Profile */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleNewChat}
                className="p-2 text-slate-300 hover:text-white active:scale-95"
                title="New Chat"
              >
                <SquarePen size={19} />
              </button>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="p-1 -mr-1"
                title={currentUser ? "Account" : "Sign In"}
              >
                <UserAvatar
                  photoURL={currentUser?.photoURL}
                  displayName={currentUser?.displayName || currentUser?.email}
                  size={28}
                />
              </button>
            </div>
          </div>

          {/* DESKTOP HEADER */}
          <div className="hidden sm:flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#12192c] transition-colors"
                title="Toggle Sidebar"
              >
                <PanelLeft size={19} />
              </button>

              <div className="flex items-center gap-2.5">
                <GyaanXLogo size={32} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[14px] text-white tracking-tight">GyaanX AI</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Online • GyaanX 2.0
                  </span>
                </div>
              </div>
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuickModal('search')}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#12192c] transition-colors cursor-pointer"
                title="Search chats"
              >
                <Search size={18} />
              </button>

              <button
                type="button"
                onClick={() => {}}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#12192c] transition-colors cursor-pointer"
                title="Theme: Obsidian Dark"
              >
                <Moon size={18} />
              </button>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#12192c] transition-colors cursor-pointer"
                title="Preferences & Model"
              >
                <SlidersHorizontal size={18} />
              </button>

              {/* User Avatar & Login Trigger */}
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="ml-1 cursor-pointer active:scale-95 transition-transform flex items-center gap-2 p-1 rounded-full hover:bg-slate-800/60"
                title={currentUser ? `${currentUser.displayName || currentUser.email} (Manage profile)` : 'Sign In with Google or GitHub'}
              >
                <UserAvatar
                  photoURL={currentUser?.photoURL}
                  displayName={currentUser?.displayName || currentUser?.email}
                  size={32}
                />
              </button>
            </div>
          </div>
        </header>

        {/* Message Feed Container - scrolls independently */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col overscroll-contain">
          {activeConversation?.messages && activeConversation.messages.length > 0 ? (
            <div className="flex-1 pb-4">
              {activeConversation.messages.map((message, index) => {
                const isLastAssistant =
                  index === activeConversation.messages.length - 1 &&
                  message.role === 'assistant';

                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isLastAssistant={isLastAssistant}
                    onRegenerate={handleRegenerate}
                    userPhotoURL={currentUser?.photoURL}
                    userName={currentUser?.displayName || currentUser?.email}
                  />
                );
              })}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Permanently Anchored Input Footer - Never Scrolls Away */}
        <div className="shrink-0 w-full z-20 bg-[#080c14] border-t border-[#141b2c]/80 pb-[env(safe-area-inset-bottom,0px)]">
          <ChatInput
            onSendMessage={(content, image) => handleSendMessage(content, image)}
            isStreaming={isStreaming}
            onStop={handleStop}
            enableSearch={settings.enableSearch}
            onToggleSearch={() =>
              setSettings((prev) => ({ ...prev, enableSearch: !prev.enableSearch }))
            }
            isLoggedIn={!!currentUser}
            onRequireLogin={() => setIsAuthModalOpen(true)}
          />
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        activeConversation={activeConversation}
      />

      {/* API Usage & Daily Quota Modal */}
      <UsageModal
        isOpen={isUsageOpen}
        onClose={() => setIsUsageOpen(false)}
        dailyStats={dailyStats}
        currentModel={settings.model || 'gemini-2.5-flash'}
      />

      {/* Auth & Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
      />

      {/* Dedicated Pro Mode Modal */}
      <ProModeModal
        isOpen={isProModeOpen}
        onClose={() => setIsProModeOpen(false)}
        onSelectModel={(model) => setSettings((prev) => ({ ...prev, model: model as any }))}
        currentModel={settings.model}
      />

      {/* Clear Messages Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearCurrentModal}
        title="Clear Current Chat"
        message="Clear all messages in this conversation? The conversation itself will remain open."
        confirmLabel="Clear Chat"
        onConfirm={() => {
          setShowClearCurrentModal(false);
          handleClearCurrentMessages();
        }}
        onCancel={() => setShowClearCurrentModal(false)}
      />

      {/* Quick Explore / Prompts / Tools / Search Modal */}
      <QuickModal
        isOpen={!!quickModal}
        type={quickModal || 'explore'}
        onClose={() => setQuickModal(null)}
        onSelectPrompt={(p) => handleSendMessage(p)}
      />
    </div>
  );
}
