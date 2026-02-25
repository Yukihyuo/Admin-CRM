import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Profile {
  names: string;
  lastNames: string;
  phone?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  profile: Profile;
}

export interface Store {
  _id?: string;
  id?: string;
  name: string;
}

export interface Access {
  brandId: string;
  level: string; // 'brand' o 'store'
  permissions: string[];
  stores: Store[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  access: Access | null;
  activeStore: Store | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (token: string, user: User, access: Access) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  setActiveStore: (storeId: string) => void;

  // Getters
  getUserId: () => string | null;
  getProfile: () => Profile | null;
  getUsername: () => string | null;
  getEmail: () => string | null;
  
  // Access Getters
  getBrandId: () => string | null;
  getLevel: () => string | null;
  getPermissions: () => string[] | null;
  getStores: () => Store[] | null;
  getActiveStore: () => Store | null;
  getActiveStoreId: () => string | null;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      access: null,
      activeStore: null,
      isAuthenticated: false,

      setAuth: (token, user, access) =>
        set({
          token,
          user,
          access,
          activeStore: access.stores[0] ?? null,
          isAuthenticated: true,
        }),

      clearAuth: () =>
        set({
          token: null,
          user: null,
          access: null,
          activeStore: null,
          isAuthenticated: false,
        }),

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      setActiveStore: (storeId) =>
        set((state) => {
          const stores = state.access?.stores ?? [];
          const nextStore = stores.find((store) => (store._id ?? store.id) === storeId) ?? null;

          if (!nextStore) {
            return {};
          }

          return {
            activeStore: nextStore,
          };
        }),

      getUserId: () => {
        const state = get();
        return state.user?.id ?? null;
      },

      getProfile: () => {
        const state = get();
        return state.user?.profile ?? null;
      },

      getUsername: () => {
        const state = get();
        return state.user?.username ?? null;
      },

      getEmail: () => {
        const state = get();
        return state.user?.email ?? null;
      },

      // Access Getters
      getBrandId: () => {
        const state = get();
        return state.access?.brandId ?? null;
      },

      getLevel: () => {
        const state = get();
        return state.access?.level ?? null;
      },

      getPermissions: () => {
        const state = get();
        return state.access?.permissions ?? null;
      },

      getStores: () => {
        const state = get();
        return state.access?.stores ?? null;
      },

      getActiveStore: () => {
        const state = get();

        if (state.activeStore) {
          return state.activeStore;
        }

        return state.access?.stores[0] ?? null;
      },

      getActiveStoreId: () => {
        const state = get();
        const store = state.activeStore ?? state.access?.stores[0] ?? null;

        return store?._id ?? store?.id ?? null;
      },

      hasPermission: (permission: string) => {
        const state = get();
        return state.access?.permissions.includes(permission) ?? false;
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }

        if (!state.activeStore && state.access?.stores?.length) {
          state.setActiveStore(state.access.stores[0]._id ?? state.access.stores[0].id ?? '');
        }
      },
    }
  )
);
