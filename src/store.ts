import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MaintJob = {
  id: string;
  lot: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  opened: string;
  started?: string;
  finished?: string;
};

export type InventoryItem = {
  name: string;
  qty: number;
  threshold: number;
};

export type HomeCount = {
  key: string;
  label: string;
  tab: string;
  filter: string;
  count: number;
};

type FeatureStore = {
  maintJobs: MaintJob[];
  inventory: InventoryItem[];
  addMaintJob: (job: MaintJob) => void;
  updateMaintJob: (id: string, patch: Partial<MaintJob>) => void;
  setInventoryItem: (name: string, qty: number, threshold: number) => void;
  openTab: (tab: string, filter: string) => void;
  getHomeCounts?: () => HomeCount[];
};

export const useStore = create<FeatureStore>()(
  persist(
    (set) => ({
      maintJobs: [],
      inventory: [],
      addMaintJob: (job) => set((state) => ({ maintJobs: [...state.maintJobs, job] })),
      updateMaintJob: (id, patch) =>
        set((state) => ({
          maintJobs: state.maintJobs.map((job) => (job.id === id ? { ...job, ...patch } : job)),
        })),
      setInventoryItem: (name, qty, threshold) =>
        set((state) => {
          const exists = state.inventory.some((item) => item.name === name);
          const inventory = exists
            ? state.inventory.map((item) => (item.name === name ? { name, qty, threshold } : item))
            : [...state.inventory, { name, qty, threshold }];
          return { inventory };
        }),
      openTab: () => {
        /* The main view owns tab navigation. Cards call this without a listener yet. */
      },
    }),
    {
      name: "magnolia-feature-store",
      partialize: (state) => ({ maintJobs: state.maintJobs, inventory: state.inventory }),
    },
  ),
);
