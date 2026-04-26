/**
 * Unified storage adapter.
 * Automatically selects the right backend:
 *   - Capacitor (iOS/Android): @capacitor/preferences
 *   - Web / Tauri dev: localStorage
 *
 * The Zustand persist middleware expects a synchronous-looking interface, but
 * Capacitor Preferences is async. We bridge this by keeping an in-memory cache
 * that is hydrated once on startup, then written through on every set/remove.
 */

type StorageLike = {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
};

// Detect Capacitor runtime
function isCapacitor(): boolean {
  return typeof (window as { Capacitor?: unknown }).Capacitor !== 'undefined';
}

// ── Capacitor async adapter ───────────────────────────────────────────────────
async function makeCapacitorStorage(): Promise<StorageLike> {
  const { Preferences } = await import('@capacitor/preferences');

  return {
    getItem: async (key) => {
      const { value } = await Preferences.get({ key });
      return value;
    },
    setItem: async (key, value) => {
      await Preferences.set({ key, value });
    },
    removeItem: async (key) => {
      await Preferences.remove({ key });
    },
  };
}

// ── Web/Tauri localStorage adapter ───────────────────────────────────────────
function makeLocalStorage(): StorageLike {
  return {
    getItem:    (key) => { try { return localStorage.getItem(key); } catch { return null; } },
    setItem:    (key, value) => { try { localStorage.setItem(key, value); } catch { /* noop */ } },
    removeItem: (key) => { try { localStorage.removeItem(key); } catch { /* noop */ } },
  };
}

// Singleton promise so we only resolve once
let _adapter: StorageLike | null = null;

export async function getStorageAdapter(): Promise<StorageLike> {
  if (_adapter) return _adapter;
  _adapter = isCapacitor() ? await makeCapacitorStorage() : makeLocalStorage();
  return _adapter;
}

// Sync accessor for Zustand (falls back to localStorage until async adapter ready)
export function getSyncStorage(): StorageLike {
  return _adapter ?? makeLocalStorage();
}
