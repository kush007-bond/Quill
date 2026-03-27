import React, { useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import { useDocumentStore } from './store/useDocumentStore';

/**
 * Root Application Component
 * Initializes the app with a welcome document and renders the main layout.
 */
function App() {
  const { documents, addDocument, setActiveDocument } = useDocumentStore();
  const initialized = React.useRef(false);

  useEffect(() => {
    // Guard against React 18 StrictMode double-invoke
    if (initialized.current) return;
    initialized.current = true;

    if (documents.length === 0) {
      const welcomeDoc = {
        id: 'welcome-quill',
        title: 'Welcome to Quill',
        content: `# Welcome to Quill ✍️

**Write deeply. Ship freely.**

Quill is a minimalist, distraction-free writing environment. Everything you write is saved locally in your browser.

## Getting Started
1. **Focus Mode:** Click the expand icon to hide the preview.
2. **Split View:** Click the columns icon to see the preview side-by-side.
3. **Markdown:** Use standard markdown syntax like **bold**, *italic*, and [links](https://google.com).

> "The best tool disappears. Only the words remain."

Start typing here to begin your journey.`,
        tags: ['welcome', 'guide'],
        folderId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        wordCount: 0,
        readingTimeMinutes: 0,
        isEncrypted: false,
        isFavourite: true,
        isPinned: true,
      };
      
      addDocument(welcomeDoc);
      setActiveDocument(welcomeDoc.id);
    }
  }, []);

  return <MainLayout />;
}

export default App;
