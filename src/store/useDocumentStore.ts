import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Document, Folder } from '@/types/document';
import { getSyncStorage } from '@/lib/storage';

interface DocumentState {
  documents: Document[];
  folders: Folder[];
  activeDocumentId: string | null;

  setDocuments: (docs: Document[]) => void;
  setFolders: (folders: Folder[]) => void;
  setActiveDocument: (id: string | null) => void;
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  addFolder: (folder: Folder) => void;
  deleteFolder: (id: string) => void;
}

// Revive ISO date strings back to Date objects after JSON parse
const dateReviver = (_key: string, value: unknown) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value);
  }
  return value;
};

const storage = createJSONStorage(() => ({
  getItem: (name: string): string | null | Promise<string | null> => {
    const adapter = getSyncStorage();
    const result = adapter.getItem(name);
    if (result instanceof Promise) {
      return result.then((str) => {
        if (!str) return null;
        return JSON.stringify(JSON.parse(str, dateReviver));
      });
    }
    if (!result) return null;
    return JSON.stringify(JSON.parse(result, dateReviver));
  },
  setItem: (name: string, value: string) => getSyncStorage().setItem(name, value),
  removeItem: (name: string) => getSyncStorage().removeItem(name),
}));

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set) => ({
      documents: [],
      folders: [],
      activeDocumentId: null,

      setDocuments: (documents) => set({ documents }),
      setFolders: (folders) => set({ folders }),
      setActiveDocument: (activeDocumentId) => set({ activeDocumentId }),

      addDocument: (doc) => set((state) => ({
        documents: [doc, ...state.documents],
      })),

      updateDocument: (id, updates) => set((state) => ({
        documents: state.documents.map((doc) =>
          doc.id === id ? { ...doc, ...updates, updatedAt: new Date() } : doc
        ),
      })),

      deleteDocument: (id) => set((state) => ({
        documents: state.documents.filter((doc) => doc.id !== id),
        activeDocumentId: state.activeDocumentId === id
          ? (state.documents.find((d) => d.id !== id)?.id ?? null)
          : state.activeDocumentId,
      })),

      addFolder: (folder) => set((state) => ({
        folders: [...state.folders, folder],
      })),

      deleteFolder: (id) => set((state) => ({
        folders: state.folders.filter((f) => f.id !== id),
        documents: state.documents.map((d) =>
          d.folderId === id ? { ...d, folderId: null } : d
        ),
      })),
    }),
    {
      name: 'quill-store',
      storage,
    }
  )
);
