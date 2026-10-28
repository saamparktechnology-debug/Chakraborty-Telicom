import { Platform } from 'react-native';
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type UserRole = 'ADMIN' | 'DSE' | 'RETAILER' | 'CUSTOMER';
export type MobileRole = UserRole;

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  shopName?: string | null;
  assignedDseId?: string | null;
  address?: string | null;
  retailerProfile?: {
    id: string;
    shopName: string;
    address?: string;
    currentRunningDue?: string | number;
  } | null;
  customerProfile?: {
    id: string;
    deliveryAddress?: string;
    walletBalance?: string | number;
    dailySubscriptionQty?: number;
  } | null;
}

export type MobileSessionUser = AuthUser;

const TOKEN_KEY = 'amul_mobile_jwt_token';
const USER_KEY = 'amul_mobile_user_profile';
const API_URL_KEY = 'amul_mobile_api_base_url';
const THEME_KEY = 'amul_mobile_theme_mode';

const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL?.trim();

const DEFAULT_API_URL =
  ENV_API_URL ||
  (Platform.OS === 'android' ? 'http://192.168.0.106:4000/api' : 'http://localhost:4000/api');

async function storageGet(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function storageSet(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {
    // ignore storage errors
  }
}

async function storageDelete(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore storage errors
  }
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  apiBaseUrl: string;
  theme: 'light' | 'dark';
  isHydrated: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (token: string, user: AuthUser) => Promise<void>;
  setAuth: (token: string, user: AuthUser) => Promise<void>;
  clearSession: () => Promise<void>;
  clearAuth: () => Promise<void>;
  setApiBaseUrl: (url: string) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  apiBaseUrl: DEFAULT_API_URL,
  theme: 'light',
  isHydrated: false,
  hydrated: false,

  hydrate: async () => {
    try {
      const [savedToken, savedUserJson, savedApiUrl, savedTheme] = await Promise.all([
        storageGet(TOKEN_KEY),
        storageGet(USER_KEY),
        storageGet(API_URL_KEY),
        storageGet(THEME_KEY),
      ]);

      let parsedUser: AuthUser | null = null;
      if (savedUserJson) {
        try {
          parsedUser = JSON.parse(savedUserJson);
        } catch {
          parsedUser = null;
        }
      }

      const resolvedUrl = ENV_API_URL || savedApiUrl || DEFAULT_API_URL;

      set({
        token: savedToken,
        user: parsedUser,
        apiBaseUrl: resolvedUrl,
        theme: savedTheme === 'dark' ? 'dark' : 'light',
        isHydrated: true,
        hydrated: true,
      });
    } catch {
      set({ isHydrated: true, hydrated: true });
    }
  },

  setSession: async (token, user) => {
    await Promise.all([
      storageSet(TOKEN_KEY, token),
      storageSet(USER_KEY, JSON.stringify(user)),
    ]);
    set({ token, user });
  },

  setAuth: async (token, user) => {
    await get().setSession(token, user);
  },

  clearSession: async () => {
    await Promise.all([storageDelete(TOKEN_KEY), storageDelete(USER_KEY)]);
    set({ token: null, user: null });
  },

  clearAuth: async () => {
    await get().clearSession();
  },

  setApiBaseUrl: async (url) => {
    const cleaned = url.trim().replace(/\/+$/, '');
    await storageSet(API_URL_KEY, cleaned);
    set({ apiBaseUrl: cleaned });
  },

  toggleTheme: async () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    await storageSet(THEME_KEY, next);
    set({ theme: next });
  },
}));
