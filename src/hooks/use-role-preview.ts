import { create } from "zustand";

export type AppRole = "admin" | "brand_manager" | "team_member" | "client";

interface RolePreviewState {
  previewRole: AppRole | null;
  setPreviewRole: (role: AppRole | null) => void;
}

export const useRolePreview = create<RolePreviewState>((set) => ({
  previewRole: null,
  setPreviewRole: (role) => set({ previewRole: role }),
}));
