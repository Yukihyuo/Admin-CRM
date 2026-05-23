import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Module {
  _id: string;
  page: string;
  type: string;
}

interface ModulesState {
  modules: Module[];
  
  // Actions
  setModules: (modules: Module[]) => void;
  clearModules: () => void;
  getModulesByPage: (page: string) => Module[];
  hasModule: (page: string, type?: string) => boolean;
}

export const useModulesStore = create<ModulesState>()(
  persist(
    (set, get) => ({
      modules: [],

      setModules: (modules) =>
        set({
          modules,
        }),

      clearModules: () =>
        set({
          modules: [],
        }),

      getModulesByPage: (page) => {
        const state = get();
        return state.modules.filter(mod => mod.page === page);
      },

      hasModule: (page, type) => {
        const state = get();
        if (type) {
          return state.modules.some(mod => mod.page === page && mod.type === type);
        }
        return state.modules.some(mod => mod.page === page);
      },
    }),
    {
      name: 'modules-storage',
    }
  )
);
