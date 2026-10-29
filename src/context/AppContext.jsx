import { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { reducer } from './reducer';
import { createInitialState, STATE_VERSION } from '../data/mockData';

const STATE_KEY = 'restropos_state_v1';
const USER_KEY = 'restropos_user_v1';
const CLOCK_KEY = 'restropos_last_seen';
const CHANNEL_NAME = 'restropos_sync';

const AppContext = createContext(null);

// Eski versiyadagi ma'lumotni yo'qotmasdan yangi maydonlar bilan birlashtiradi
// (masalan keyinroq qo'shilgan yangi bo'lim/massiv bo'lsa, u standart holatdan olinadi,
// mavjud foydalanuvchi ma'lumotlari esa saqlanib qoladi).
function migrate(oldState) {
  const fresh = createInitialState();
  if (!oldState || typeof oldState !== 'object') return fresh;
  const merged = { ...fresh };
  Object.keys(fresh).forEach((k) => {
    if (oldState[k] === undefined) return;
    // "settings" ichiga keyinroq qo'shilgan yangi maydonlar (masalan vatEnabled) bo'lsa,
    // ular ham standart qiymat bilan to'ldiriladi — faqat tashqi massivlar almashtiriladi.
    merged[k] = k === 'settings' && typeof oldState[k] === 'object' ? { ...fresh[k], ...oldState[k] } : oldState[k];
  });
  merged.version = STATE_VERSION;
  return merged;
}

function detectClockIssue() {
  try {
    const last = +localStorage.getItem(CLOCK_KEY);
    const now = Date.now();
    localStorage.setItem(CLOCK_KEY, String(now));
    // Qurilma soati oldingi saqlangan vaqtdan 5 daqiqadan ko'proq orqada bo'lsa — shubhali
    if (last && now < last - 5 * 60000) return true;
  } catch {
    /* ignore */
  }
  return false;
}

function init() {
  let raw = null;
  try {
    raw = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
  } catch {
    raw = null;
  }
  let base;
  if (!raw) base = createInitialState();
  else if (raw.version !== STATE_VERSION) base = migrate(raw);
  else base = raw;

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    user = null;
  }
  const clockWarning = detectClockIssue();
  return { ...base, user, storageWarning: null, clockWarning };
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const channelRef = useRef(null);
  const lastSavedAt = useRef(0);
  const skipNextBroadcast = useRef(false);

  useEffect(() => {
    if ('BroadcastChannel' in window) channelRef.current = new BroadcastChannel(CHANNEL_NAME);
    return () => channelRef.current?.close();
  }, []);

  // State'ni saqlash (user alohida saqlanadi — tablar orasida sinxron bo'lishi uchun)
  useEffect(() => {
    try {
      const { user, storageWarning, clockWarning, ...rest } = state;
      localStorage.setItem(STATE_KEY, JSON.stringify(rest));
      const savedAt = Date.now();
      lastSavedAt.current = savedAt;
      if (!skipNextBroadcast.current) channelRef.current?.postMessage({ state: rest, savedAt });
      skipNextBroadcast.current = false;
      if (state.storageWarning) dispatch({ type: 'STORAGE_WARNING', message: null });
    } catch (err) {
      const message = err?.name === 'QuotaExceededError'
        ? "Xotira to'lgan — eski ma'lumotlarni arxivlang yoki zaxira nusxa olib, tozalang"
        : "Ma'lumotlarni saqlashda xatolik yuz berdi";
      if (state.storageWarning !== message) dispatch({ type: 'STORAGE_WARNING', message });
    }
  }, [state]);

  useEffect(() => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(state.user));
    } catch {
      /* ignore */
    }
  }, [state.user]);

  // Boshqa tab (masalan QR menyu yoki KDS ekrani) o'zgartirsa — real vaqtda yangilash.
  // BroadcastChannel asosiy kanal (tezroq, aniqroq); localStorage 'storage' hodisasi — zaxira yo'l.
  useEffect(() => {
    const applyIncoming = (incomingState, savedAt) => {
      if (savedAt && savedAt <= lastSavedAt.current) return; // eskiroq yozuvni e'tiborsiz qoldirish (konflikt)
      lastSavedAt.current = savedAt || Date.now();
      skipNextBroadcast.current = true;
      dispatch({ type: 'HYDRATE', state: incomingState });
    };

    const onMessage = (e) => applyIncoming(e.data?.state, e.data?.savedAt);
    channelRef.current?.addEventListener('message', onMessage);

    const onStorage = (e) => {
      if (e.key !== STATE_KEY || !e.newValue) return;
      try {
        applyIncoming(JSON.parse(e.newValue), Date.now());
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      channelRef.current?.removeEventListener('message', onMessage);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp AppProvider ichida ishlatilishi kerak');
  return ctx;
}
