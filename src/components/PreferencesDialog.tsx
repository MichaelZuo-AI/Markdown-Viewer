import { useAppStore, type ExportTheme, type KeybindingMode, type Theme } from "@/store/appStore";

export default function PreferencesDialog() {
  const preferencesOpen = useAppStore((s) => s.preferencesOpen);
  const preferences = useAppStore((s) => s.preferences);
  const theme = useAppStore((s) => s.theme);
  const keybindingMode = useAppStore((s) => s.keybindingMode);
  const setPreferencesOpen = useAppStore((s) => s.setPreferencesOpen);
  const setPreferences = useAppStore((s) => s.setPreferences);
  const setTheme = useAppStore((s) => s.setTheme);
  const setKeybindingMode = useAppStore((s) => s.setKeybindingMode);

  if (!preferencesOpen) return null;

  return (
    <div className="overlay-backdrop" role="presentation">
      <div className="preferences-panel" role="dialog" aria-label="Preferences">
        <div className="preferences-header">
          <h2>Preferences</h2>
          <button
            className="tb-btn"
            type="button"
            aria-label="Close preferences"
            onClick={() => setPreferencesOpen(false)}
          >
            x
          </button>
        </div>

        <label className="preference-row">
          <span>Theme</span>
          <select
            aria-label="Theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>

        <label className="preference-row">
          <span>Keybindings</span>
          <select
            aria-label="Keybindings"
            value={keybindingMode}
            onChange={(e) => setKeybindingMode(e.target.value as KeybindingMode)}
          >
            <option value="default">Standard</option>
            <option value="vim">Vim</option>
            <option value="emacs">Emacs</option>
          </select>
        </label>

        <label className="preference-row preference-row-check">
          <span>Auto-save to file</span>
          <input
            aria-label="Auto-save to file"
            type="checkbox"
            checked={preferences.autoSaveToFile}
            onChange={(e) => setPreferences({ autoSaveToFile: e.target.checked })}
          />
        </label>

        <label className="preference-row">
          <span>Default split ratio</span>
          <input
            aria-label="Default split ratio"
            type="number"
            min="20"
            max="80"
            value={preferences.defaultSplitRatio}
            onChange={(e) => setPreferences({ defaultSplitRatio: Number(e.target.value) })}
          />
        </label>

        <label className="preference-row preference-row-check">
          <span>Markdown line breaks</span>
          <input
            aria-label="Markdown line breaks"
            type="checkbox"
            checked={preferences.markdownLineBreaks}
            onChange={(e) => setPreferences({ markdownLineBreaks: e.target.checked })}
          />
        </label>

        <label className="preference-row">
          <span>Export theme</span>
          <select
            aria-label="Export theme"
            value={preferences.exportTheme}
            onChange={(e) => setPreferences({ exportTheme: e.target.value as ExportTheme })}
          >
            <option value="current">Current</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>
      </div>
    </div>
  );
}
