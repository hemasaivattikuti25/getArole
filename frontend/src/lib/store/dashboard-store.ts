import { create } from 'zustand';
import { JobListing } from '../types';

interface DashboardState {
  selectedJobId: string | null;
  setSelectedJobId: (id: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedJobId: null,
  setSelectedJobId: (id) => set({ selectedJobId: id }),
}));
