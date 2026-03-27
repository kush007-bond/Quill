export type EditorMode = 'source' | 'split' | 'preview';
export type Theme = 'light' | 'dark' | 'sepia' | 'system' | 'oled';

export interface UserSettings {
  theme: Theme;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  lineWidth: number;           // Max chars per line (e.g. 65–80)
  spellcheck: boolean;
  typewriterMode: boolean;
  focusMode: boolean;
  dailyWordGoal: number;
  ambientSound: string | null; // AmbientSound in spec
  keyboardShortcuts: Record<string, string>;
  editorMode: EditorMode;
}
