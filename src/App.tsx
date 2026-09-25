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
  ChevronDown,
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
import { ModelSelectorDropdown } from './components/ModelSelectorDropdown.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { ChatMessage } from './components/ChatMessage.tsx';
import { ChatInput } from './components/ChatInput.tsx';
import { EmptyState } from './components/EmptyState.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { UsageModal } from './components/UsageModal.tsx';
import { ConfirmModal } from './components/ConfirmModal.tsx';
import { QuickModal } from './components/QuickModals.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { ProModeModal } from './components/ProModeModal.tsx';
import { GyaanXLogo } from './components/GyaanXLogo.tsx';
import { UserAvatar } from './components/UserAvatar.tsx';
import { ImagesGalleryPage } from './components/ImagesGalleryPage.tsx';
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
import { loadDailyStats, recordUsage, MODEL_QUOTA_SPECS, getModelQuota, getTodayKey } from './quotaUtils.ts';
import { checkAbuseAndRateLimit, recordDeviceUsage } from './antiAbuse.ts';
import { detectUserRegionAndTone } from './utils.ts';

const STORAGE_PREFIX = 'gyaanx_user_convs_';
const SETTINGS_KEY = 'gyaanx_chat_settings_v4';

function createEmptyConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: 'New conversation',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
}

function getStorageKey(userId?: string | null): string {
  return userId ? `${STORAGE_PREFIX}${userId}` : 'gyaanx_guest_convs_v2';
}

function loadInitialConversations(userId?: string | null): Conversation[] {
  try {
    // Purge any old demo chats from localStorage
    localStorage.removeItem('gyaanx_chat_conversations_v4');

    const key = getStorageKey(userId);
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Strip out any legacy fake demo chats
        const clean = parsed.filter(
          (c) =>
            c &&
            typeof c.id === 'string' &&
            !c.id.startsWith('c-') &&
            !c.messages?.some(
              (m: any) =>
                m.content?.includes('Matrix Reloaded') ||
                m.content?.includes('Ye dekho bro') ||
                m.content?.includes('Are bhai! Kya killer pic')
            )
        );
        if (clean.length > 0) return clean;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return [createEmptyConversation()];
}

function getModelDisplayName(model: string): string {
  if (model === 'gemini-3.8-flash') return 'GyaanX Flash';
  if (model === 'gemini-3.1-pro-preview' || model === 'gemini-3.1-pro') return 'GyaanX Pro';
  if (model === 'gemini-flash-latest') return 'GyaanX Core';
  return 'GyaanX Turbo';
}

export default function App() {
  const { isIndia, tone: defaultTone } = detectUserRegionAndTone();

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProModeOpen, setIsProModeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'images'>('chats');

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const user = getStoredUser();
    return loadInitialConversations(user?.uid);
  });

  const [activeId, setActiveId] = useState<string>(() => {
    return conversations[0]?.id || crypto.randomUUID();
  });

  const [settings, setSettings] = useState<ChatSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const resolvedModel =
          parsed.model === 'gemini-2.5-flash' || !parsed.model
            ? 'gemini-3.1-flash-lite'
            : parsed.model;
        return {
          enableSearch: false,
          tone: parsed.tone || defaultTone,
          systemInstruction: parsed.systemInstruction || '',
          model: resolvedModel,
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
      model: 'gemini-3.1-flash-lite',
      customApiKey: '',
    };
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [extendedThinking, setExtendedThinking] = useState(false);
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

        // ☁️ Sync Cloud conversations from Firestore for this specific account
        try {
          const cloudConvs = await fetchUserConversationsFromCloud(fbUser.uid);
          if (cloudConvs && cloudConvs.length > 0) {
            const cleanConvs = cloudConvs.filter(
              (c) =>
                c &&
                !c.id.startsWith('c-') &&
                !c.messages?.some((m) => m.content?.includes('Matrix Reloaded'))
            );
            if (cleanConvs.length > 0) {
              setConversations(cleanConvs);
              setActiveId(cleanConvs[0].id);
              localStorage.setItem(getStorageKey(fbUser.uid), JSON.stringify(cleanConvs));
            } else {
              const fresh = [createEmptyConversation()];
              setConversations(fresh);
              setActiveId(fresh[0].id);
            }
          } else {
            // Check if current device already has local chats (e.g. user was chatting before logging in)
            const localKey = getStorageKey(fbUser.uid);
            const guestKey = getStorageKey(undefined);
            const savedLocal = localStorage.getItem(localKey) || localStorage.getItem(guestKey);
            let localWithMessages: Conversation[] = [];
            if (savedLocal) {
              try {
                const parsed: Conversation[] = JSON.parse(savedLocal);
                localWithMessages = parsed.filter((c) => c && c.messages && c.messages.length > 0);
              } catch (e) {
                console.error(e);
              }
            }

            if (localWithMessages.length > 0) {
              setConversations(localWithMessages);
              setActiveId(localWithMessages[0].id);
              // Migrate local conversations to Firestore cloud so other devices will see them!
              for (const conv of localWithMessages) {
                saveUserConversationToCloud(fbUser.uid, conv).catch((err) =>
                  console.warn('Migrate to cloud failed:', err)
                );
              }
            } else {
              const fresh = [createEmptyConversation()];
              setConversations(fresh);
              setActiveId(fresh[0].id);
            }
          }

          const cloudQuota = await fetchUserDailyQuotaFromCloud(fbUser.uid, getTodayKey());
          if (cloudQuota) {
            setDailyStats(cloudQuota);
          }
        } catch (err) {
          console.warn('Failed to load user cloud data:', err);
        }
      } else {
        // User logged out: Reset session completely so no chats are leaked to guest or other users/devices!
        setCurrentUser(null);
        saveStoredUser(null);
        const fresh = [createEmptyConversation()];
        setConversations(fresh);
        setActiveId(fresh[0].id);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync conversations to scoped localStorage
  useEffect(() => {
    try {
      const key = getStorageKey(currentUser?.uid);
      localStorage.setItem(key, JSON.stringify(conversations));
    } catch (e) {
      console.error(e);
    }
  }, [conversations, currentUser?.uid]);

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
      const nextConversations = filtered.length === 0 ? [createEmptyConversation()] : filtered;
      if (filtered.length === 0) {
        setActiveId(nextConversations[0].id);
      } else if (activeId === id) {
        setActiveId(filtered[0].id);
      }
      try {
        const key = getStorageKey(currentUser?.uid);
        localStorage.setItem(key, JSON.stringify(nextConversations));
      } catch (err) {
        console.error(err);
      }
      return nextConversations;
    });

    if (currentUser?.uid) {
      deleteUserConversationFromCloud(currentUser.uid, id).catch((err) =>
        console.warn('Cloud delete error:', err)
      );
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
      const warningMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `⚠️ ${abuseCheck.reason || 'Please wait a moment before sending another message.'}`,
        timestamp: Date.now(),
        isError: true,
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, warningMessage], updatedAt: Date.now() }
            : c
        )
      );
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

    // Ensure conversation exists in state and sync immediately to Firestore cloud
    const activeUserId = currentUser?.uid || auth.currentUser?.uid;
    const currentConv = conversations.find((c) => c.id === activeId);
    const existingMessages = currentConv?.messages || [];
    const updatedMessages = [...existingMessages, userMessage, initialAssistantMessage];
    const updatedConv: Conversation = {
      id: activeId,
      title: computedTitle,
      createdAt: currentConv?.createdAt || Date.now(),
      updatedAt: Date.now(),
      messages: updatedMessages,
    };

    setConversations((prev) => {
      const exists = prev.some((c) => c.id === activeId);
      if (!exists) return [updatedConv, ...prev];
      return prev.map((c) => (c.id === activeId ? updatedConv : c));
    });

    if (activeUserId) {
      saveUserConversationToCloud(activeUserId, updatedConv).catch((e) =>
        console.warn('Initial cloud save failed:', e)
      );
    }

    setTimeout(() => scrollToBottom('smooth'), 50);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);
    let accumulatedText = '';

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
            model: settings.model || 'gemini-3.8-flash',
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
      let sources: any[] = [];
      let finalUsage: TokenUsage | undefined;
      let buffer = '';
      let serverStreamError = '';

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

          let data: any = null;
          try {
            data = JSON.parse(jsonStr);
          } catch {
            continue;
          }

          if (data.error) {
            serverStreamError = data.error;
            break;
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
        }

        if (serverStreamError) {
          throw new Error(serverStreamError);
        }
      }

      // Finalize assistant message and sync to Firestore
      const finalizedMessages = updatedMessages.map((m) =>
        m.id === assistantMessageId
          ? {
              ...m,
              content: accumulatedText || 'Koi response generate nahi hua.',
              sources: sources.length > 0 ? sources : undefined,
              usage: finalUsage,
              isStreaming: false,
            }
          : m
      );

      const finalConv: Conversation = {
        ...updatedConv,
        updatedAt: Date.now(),
        messages: finalizedMessages,
      };

      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? finalConv : c))
      );

      if (activeUserId) {
        saveUserConversationToCloud(activeUserId, finalConv).catch((e) =>
          console.warn('Final cloud save failed:', e)
        );
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const stoppedMessages = updatedMessages.map((m) =>
          m.id === assistantMessageId
            ? { ...m, isStreaming: false, content: m.content || '(Stopped)' }
            : m
        );
        const stoppedConv: Conversation = {
          ...updatedConv,
          updatedAt: Date.now(),
          messages: stoppedMessages,
        };
        setConversations((prev) =>
          prev.map((c) => (c.id === activeId ? stoppedConv : c))
        );
        if (activeUserId) {
          saveUserConversationToCloud(activeUserId, stoppedConv).catch((e) =>
            console.warn('Abort cloud save failed:', e)
          );
        }
      } else {
        const errContent = `⚠️ Error: ${err.message || 'Something went wrong.'}`;
        const errorMessages = updatedMessages.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: errContent,
                isStreaming: false,
                isError: true,
              }
            : m
        );
        const errorConv: Conversation = {
          ...updatedConv,
          updatedAt: Date.now(),
          messages: errorMessages,
        };
        setConversations((prev) =>
          prev.map((c) => (c.id === activeId ? errorConv : c))
        );
        if (activeUserId) {
          saveUserConversationToCloud(activeUserId, errorConv).catch((e) =>
            console.warn('Error cloud save failed:', e)
          );
        }
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = async (targetModel?: string) => {
    if (!activeConversation || activeConversation.messages.length === 0 || isStreaming) return;

    const msgs = activeConversation.messages;
    const lastAssistantIdx = [...msgs].reverse().findIndex((m) => m.role === 'assistant');
    if (lastAssistantIdx === -1) return;
    const actualAssistantIdx = msgs.length - 1 - lastAssistantIdx;
    const assistantMsg = msgs[actualAssistantIdx];

    const chosenModel = targetModel || settings.model || 'gemini-3.1-flash-lite';
    if (targetModel && targetModel !== settings.model) {
      setSettings((prev) => ({ ...prev, model: targetModel as any }));
    }

    const activeUserId = currentUser?.uid;

    // Reset this exact assistant message in-place without adding duplicate user messages
    const updatedMessages = msgs.map((m, idx) =>
      idx === actualAssistantIdx
        ? {
            ...m,
            content: '',
            isStreaming: true,
            isError: false,
            timestamp: Date.now(),
          }
        : m
    );

    const updatedConv: Conversation = {
      ...activeConversation,
      updatedAt: Date.now(),
      messages: updatedMessages,
    };

    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? updatedConv : c))
    );

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);
    let accumulatedText = '';

    try {
      // Send conversation history up to the previous user message
      const historyForApi = msgs.slice(0, actualAssistantIdx).map((m) => ({
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
          messages: historyForApi,
          settings: {
            enableSearch: settings.enableSearch,
            tone: settings.tone,
            systemInstruction: settings.systemInstruction,
            model: chosenModel,
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

          let data: any = null;
          try {
            data = JSON.parse(jsonStr);
          } catch {
            continue;
          }

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
                      m.id === assistantMsg.id
                        ? { ...m, content: accumulatedText }
                        : m
                    ),
                  };
                }
                return c;
              })
            );
          }

          if (data.sources) {
            sources = data.sources;
          }

          if (data.usage) {
            finalUsage = data.usage;
            recordDeviceUsage(currentUser?.uid, data.usage.totalTokens || 0);
          }
        }
      }

      const finalizedMessages = updatedMessages.map((m) =>
        m.id === assistantMsg.id
          ? {
              ...m,
              content: accumulatedText || 'No response received.',
              sources: sources.length > 0 ? sources : undefined,
              usage: finalUsage,
              isStreaming: false,
              isError: false,
            }
          : m
      );

      const finalConv: Conversation = {
        ...updatedConv,
        updatedAt: Date.now(),
        messages: finalizedMessages,
      };

      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? finalConv : c))
      );

      if (activeUserId) {
        saveUserConversationToCloud(activeUserId, finalConv).catch((e) =>
          console.warn('Final cloud save failed:', e)
        );
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, isStreaming: false, content: m.content || '(Stopped)' }
                      : m
                  ),
                }
              : c
          )
        );
      } else {
        const errContent = `⚠️ Error: ${err.message || 'Something went wrong.'}`;
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsg.id
                      ? {
                          ...m,
                          content: errContent,
                          isStreaming: false,
                          isError: true,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleSwitchModelAndRetry = (modelId: string) => {
    setSettings((prev) => ({ ...prev, model: modelId as any }));
    handleRegenerate(modelId);
  };

  const modelQuota = getModelQuota(settings.model);
  const tokensRemaining = Math.max(0, (modelQuota?.tpd || 10000000) - (dailyStats?.totalTokensUsed || 0));

  // If user is not logged in, display full-screen LoginPage with blurred video background
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          saveStoredUser(user);
          const userConvs = loadInitialConversations(user.uid);
          setConversations(userConvs);
          setActiveId(userConvs[0]?.id || crypto.randomUUID());
        }}
      />
    );
  }

  return (
    <div className="flex h-dvh max-h-dvh w-full bg-[#080c14] text-slate-100 overflow-hidden font-sans fixed inset-0">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => {
          setActiveId(id);
          setActiveTab('chats');
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }}
        onNewChat={() => {
          handleNewChat();
          setActiveTab('chats');
        }}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onClearAll={handleClearAll}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenUsage={() => setIsUsageOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        currentUser={currentUser}
        tokensLeft={tokensRemaining}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
        currentModel={settings.model}
      />

      {/* Main Viewport: Chat View or Images Gallery View */}
      {activeTab === 'images' ? (
        <ImagesGalleryPage
          conversations={conversations}
          onOpenConversation={(convId) => {
            setActiveId(convId);
            setActiveTab('chats');
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
          }}
          onBackToChat={() => setActiveTab('chats')}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />
      ) : (
        /* Main Chat Viewport */
        <main className="flex-1 flex flex-col h-full min-h-0 bg-[#080c14] relative overflow-hidden">
          {/* Floating Top Header with True Feathered Mask Gradient & Backdrop Blur */}
          <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none select-none">
            {/* Feathered backdrop blur & dark gradient mask */}
            <div
              className="absolute inset-x-0 top-0 h-24 sm:h-28 bg-gradient-to-b from-[#080c14]/95 via-[#080c14]/80 to-transparent backdrop-blur-xl pointer-events-none"
              style={{
                WebkitMaskImage:
                  'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 45%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0) 100%)',
                maskImage:
                  'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 45%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0) 100%)',
              }}
            />

            {/* Interactive Header Bar */}
            <header className="relative pointer-events-auto h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between transition-all">
              {/* Left: 2-line minimalist menu & model selector pill with popup */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                  className="p-2 -ml-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
                  title="Toggle sidebar"
                >
                  <div className="w-5 flex flex-col gap-1.5 py-0.5">
                    <span className="w-5 h-[2px] bg-slate-300 rounded-full" />
                    <span className="w-5 h-[2px] bg-slate-300 rounded-full" />
                  </div>
                </button>

                {/* Real GyaanX Model Selector Pill with Clean Status & Smooth Hover */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsModelDropdownOpen((prev) => !prev)}
                    className="group flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-slate-100 hover:text-white text-[13.5px] sm:text-[14px] font-medium transition-all duration-200 cursor-pointer border border-white/[0.08] hover:border-white/[0.16] shadow-xs active:scale-95 backdrop-blur-md"
                    title="Switch AI Engine"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400/90 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    <span className="tracking-tight">{getModelDisplayName(settings.model)}</span>
                    <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-200 mt-0.5 transition-transform duration-200 group-hover:translate-y-0.5" />
                  </button>

                  {/* Floating Model Dropdown Popover */}
                  <ModelSelectorDropdown
                    isOpen={isModelDropdownOpen}
                    onClose={() => setIsModelDropdownOpen(false)}
                    selectedModel={settings.model}
                    onSelectModel={(modelId) => {
                      setSettings((prev) => ({ ...prev, model: modelId }));
                    }}
                    extendedThinking={extendedThinking}
                    onToggleExtendedThinking={() => setExtendedThinking((prev) => !prev)}
                  />
                </div>
              </div>

              {/* Right: Clean New Chat button */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
                  title="New Chat"
                >
                  <SquarePen size={19} strokeWidth={1.75} />
                </button>
              </div>
            </header>
          </div>

          {/* Message Feed Container - scrolls underneath the header with top padding */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col overscroll-contain no-scrollbar pt-16 sm:pt-18">
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
                      onRegenerate={() => handleRegenerate()}
                      onSwitchModelAndRetry={handleSwitchModelAndRetry}
                      userPhotoURL={currentUser?.photoURL}
                      userName={currentUser?.displayName || currentUser?.email}
                      onOpenProfile={() => setIsProfileModalOpen(true)}
                    />
                  );
                })}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            ) : (
              <EmptyState userName={currentUser?.displayName || currentUser?.email} />
            )}
          </div>

          {/* Floating Input Footer with soft gradient atmospheric blur-fade behind the box */}
          <div className="shrink-0 w-full z-20 bg-gradient-to-t from-[#080c14] via-[#080c14]/90 to-transparent pt-3 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md">
            <ChatInput
              onSendMessage={(content, image) => handleSendMessage(content, image)}
              isStreaming={isStreaming}
              onStop={handleStop}
              isLoggedIn={!!currentUser}
              onRequireLogin={() => setIsAuthModalOpen(true)}
            />
          </div>
        </main>
      )}

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
        currentModel={settings.model || 'gemini-3.1-flash-lite'}
      />

      {/* Auth & Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
      />

      {/* Account Profile & AI Instructions Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
          saveStoredUser(updated);
        }}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings(newSettings)}
        onRequireLogin={() => setIsAuthModalOpen(true)}
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
