import React, { useState } from 'react';
import { useDocumentStore } from '@/store/useDocumentStore';
import {
  FilePlus, FileText, FolderPlus, Folder as FolderIcon,
  ChevronRight, ChevronDown, Settings, Trash2,
} from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  onSettings: () => void;
}

const Sidebar: React.FC<Props> = ({ onSettings }) => {
  const {
    documents, folders, activeDocumentId,
    setActiveDocument, addDocument, deleteDocument,
    addFolder, deleteFolder,
  } = useDocumentStore();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [hoveredDoc, setHoveredDoc] = useState<string | null>(null);

  const handleCreateDoc = (folderId: string | null = null) => {
    const newDoc = {
      id: crypto.randomUUID(),
      title: 'Untitled Document',
      content: '',
      tags: [],
      folderId,
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
    if (folderId) {
      setExpandedFolders((prev) => new Set([...prev, folderId]));
    }
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    addFolder({
      id: crypto.randomUUID(),
      name,
      parentId: null,
      createdAt: new Date(),
    });
    setNewFolderName('');
    setShowFolderInput(false);
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const unfiledDocs = documents.filter((d) => !d.folderId);

  return (
    <div className="w-[240px] h-full bg-surface border-r border-border flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h1 className="text-xl font-serif italic text-accent font-bold">Quill</h1>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setShowFolderInput((v) => !v)}
            title="New folder"
            className="p-1.5 rounded-md text-muted hover:bg-overlay hover:text-secondary transition-colors"
          >
            <FolderPlus size={15} />
          </button>
          <button
            onClick={() => handleCreateDoc()}
            title="New document"
            className="p-1.5 rounded-md text-muted hover:bg-overlay hover:text-secondary transition-colors"
          >
            <FilePlus size={15} />
          </button>
        </div>
      </div>

      {/* New folder input */}
      {showFolderInput && (
        <div className="px-3 pb-2">
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') { setShowFolderInput(false); setNewFolderName(''); }
            }}
            placeholder="Folder name…"
            className="w-full bg-canvas border border-border rounded-md px-2.5 py-1 text-xs text-primary placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">

        {/* Folders */}
        {folders.map((folder) => {
          const folderDocs = documents.filter((d) => d.folderId === folder.id);
          const isExpanded = expandedFolders.has(folder.id);

          return (
            <div key={folder.id}>
              <div className="group flex items-center gap-1 px-2 py-1.5 rounded-md text-secondary hover:bg-overlay hover:text-primary transition-colors">
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
                >
                  {isExpanded ? <ChevronDown size={12} className="flex-shrink-0" /> : <ChevronRight size={12} className="flex-shrink-0" />}
                  <FolderIcon size={13} className="flex-shrink-0 text-accent" />
                  <span className="truncate text-xs font-medium">{folder.name}</span>
                  <span className="ml-auto text-[10px] text-muted">{folderDocs.length}</span>
                </button>
                <button
                  onClick={() => handleCreateDoc(folder.id)}
                  title="New doc in folder"
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted hover:text-secondary transition-all"
                >
                  <FilePlus size={12} />
                </button>
                <button
                  onClick={() => deleteFolder(folder.id)}
                  title="Delete folder"
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted hover:text-danger transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {isExpanded && folderDocs.map((doc) => (
                <DocRow
                  key={doc.id}
                  doc={doc}
                  active={doc.id === activeDocumentId}
                  hovered={hoveredDoc === doc.id}
                  onSelect={() => setActiveDocument(doc.id)}
                  onDelete={() => deleteDocument(doc.id)}
                  onHover={(id) => setHoveredDoc(id)}
                  indent
                />
              ))}
            </div>
          );
        })}

        {/* Unfiled documents */}
        {unfiledDocs.map((doc) => (
          <DocRow
            key={doc.id}
            doc={doc}
            active={doc.id === activeDocumentId}
            hovered={hoveredDoc === doc.id}
            onSelect={() => setActiveDocument(doc.id)}
            onDelete={() => deleteDocument(doc.id)}
            onHover={(id) => setHoveredDoc(id)}
            indent={false}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2.5 flex items-center justify-between">
        <span className="text-[11px] text-muted font-sans">{documents.length} docs</span>
        <button
          onClick={onSettings}
          title="Settings"
          className="p-1.5 rounded-md text-muted hover:bg-overlay hover:text-secondary transition-colors"
        >
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
};

interface DocRowProps {
  doc: { id: string; title: string };
  active: boolean;
  hovered: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onHover: (id: string | null) => void;
  indent: boolean;
}

const DocRow: React.FC<DocRowProps> = ({ doc, active, hovered, onSelect, onDelete, onHover, indent }) => (
  <div
    className={clsx(
      'group flex items-center gap-2 rounded-md transition-all',
      indent ? 'pl-7 pr-1.5 py-1.5' : 'px-2 py-1.5',
      active ? 'bg-overlay text-primary shadow-sm' : 'text-secondary hover:bg-overlay hover:text-primary'
    )}
    onMouseEnter={() => onHover(doc.id)}
    onMouseLeave={() => onHover(null)}
  >
    <button onClick={onSelect} className="flex items-center gap-2 flex-1 min-w-0 text-left">
      <FileText size={14} className={clsx('flex-shrink-0 transition-colors', active ? 'text-accent' : 'text-muted group-hover:text-secondary')} />
      <span className="truncate text-sm">{doc.title || 'Untitled'}</span>
    </button>
    {(hovered || active) && (
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete document"
        className="flex-shrink-0 p-0.5 rounded text-muted hover:text-danger transition-colors"
      >
        <Trash2 size={12} />
      </button>
    )}
  </div>
);

export default Sidebar;
