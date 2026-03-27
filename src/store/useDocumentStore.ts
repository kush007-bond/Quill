import { create } from 'zustand';
import { Document, Folder } from '@/types/document';

/**
 * Document Store (Zustand)
 * Manages the state of the document list, the currently active document, 
 * and folders. This implements the primary data layer as specified in Section 3.2.
 */
interface DocumentState {
  documents: Document[];
  folders: Folder[];
  activeDocumentId: string | null;
  
  // Actions
  setDocuments: (docs: Document[]) => void;
  setFolders: (folders: Folder[]) => void;
  setActiveDocument: (id: string | null) => void;
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  folders: [],
  activeDocumentId: null,

  setDocuments: (documents) => set({ documents }),
  setFolders: (folders) => set({ folders }),
  setActiveDocument: (activeDocumentId) => set({ activeDocumentId }),
  
  addDocument: (doc) => set((state) => ({ 
    documents: [doc, ...state.documents] 
  })),

  updateDocument: (id, updates) => set((state) => ({
    documents: state.documents.map((doc) => 
      doc.id === id ? { ...doc, ...updates, updatedAt: new Date() } : doc
    )
  })),
}));
