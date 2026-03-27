export interface Document {
  id: string;                    // UUID v4
  title: string;
  content: string;               // Raw markdown
  tags: string[];
  folderId: string | null;
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
  readingTimeMinutes: number;
  isEncrypted: boolean;
  isFavourite: boolean;
  isPinned: boolean;
  publishedTo?: string[];        // PublishTarget[] in spec
  frontmatter?: Record<string, unknown>;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color?: string;
  icon?: string;
  createdAt: Date;
}

export interface WritingSession {
  id: string;
  documentId: string;
  startedAt: Date;
  endedAt: Date;
  wordsWritten: number;
  wordsDeleted: number;
}
