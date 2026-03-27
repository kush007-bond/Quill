import React from 'react';
import { useDocumentStore } from '@/store/useDocumentStore';
import { FilePlus, FileText, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

/**
 * Sidebar Component
 * Lists the documents and allows the user to switch between them.
 * Includes a "New Document" button.
 */
const Sidebar: React.FC = () => {
  const { documents, activeDocumentId, setActiveDocument, addDocument } = useDocumentStore();

  const handleCreateNew = () => {
    const newDoc = {
      id: crypto.randomUUID(),
      title: 'Untitled Document',
      content: '',
      tags: [],
      folderId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      wordCount: 0,
      readingTimeMinutes: 0,
      isEncrypted: false,
      isFavourite: false,
      isPinned: false,
    };
    addDocument(newDoc);
    setActiveDocument(newDoc.id);
  };

  return (
    <div className="w-[240px] h-full bg-surface border-r border-border flex flex-col p-4 select-none">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-serif italic text-accent font-bold">Quill</h1>
        <button 
          onClick={handleCreateNew}
          className="p-1.5 rounded-md text-secondary hover:bg-overlay transition-colors"
        >
          <FilePlus size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto space-y-1">
        {documents.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setActiveDocument(doc.id)}
            className={clsx(
              "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all group",
              doc.id === activeDocumentId 
                ? "bg-overlay text-primary shadow-sm" 
                : "text-secondary hover:bg-overlay hover:text-primary"
            )}
          >
            <FileText size={16} className={clsx(
              "transition-colors",
              doc.id === activeDocumentId ? "text-accent" : "text-muted group-hover:text-secondary"
            )} />
            <span className="truncate">{doc.title || 'Untitled'}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-4 text-[11px] text-muted flex items-center justify-between">
        <span>{documents.length} documents</span>
        <ChevronRight size={12} />
      </div>
    </div>
  );
};

export default Sidebar;
