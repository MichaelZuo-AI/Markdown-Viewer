import { useMemo, useState } from "react";
import { useAppStore } from "@/store/appStore";
import * as fileOps from "@/lib/fileOps";

interface Command {
  label: string;
  run: () => void;
}

export default function CommandPalette() {
  const commandPaletteOpen = useAppStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const setQuickOpenOpen = useAppStore((s) => s.setQuickOpenOpen);
  const setGlobalSearchOpen = useAppStore((s) => s.setGlobalSearchOpen);
  const setPreferencesOpen = useAppStore((s) => s.setPreferencesOpen);
  const newMarkdownFile = useAppStore((s) => s.newMarkdownFile);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const [query, setQuery] = useState("");

  const commands = useMemo<Command[]>(() => [
    {
      label: "New Markdown",
      run: () => newMarkdownFile(),
    },
    {
      label: "Open File",
      run: () => { void fileOps.openMarkdownFile(); },
    },
    {
      label: "Open Folder",
      run: () => { void fileOps.openProjectFolder(); },
    },
    {
      label: "Quick Open",
      run: () => setQuickOpenOpen(true),
    },
    {
      label: "Search Project",
      run: () => setGlobalSearchOpen(true),
    },
    {
      label: "Preferences",
      run: () => setPreferencesOpen(true),
    },
    {
      label: "Toggle Theme",
      run: () => toggleTheme(),
    },
  ], [newMarkdownFile, setGlobalSearchOpen, setPreferencesOpen, setQuickOpenOpen, toggleTheme]);

  const matches = commands.filter((command) =>
    command.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  if (!commandPaletteOpen) return null;

  const runCommand = (command: Command) => {
    setCommandPaletteOpen(false);
    setQuery("");
    command.run();
  };

  return (
    <div className="overlay-backdrop" role="presentation">
      <div className="quick-open-panel" role="dialog" aria-label="Command palette">
        <input
          className="quick-open-input"
          placeholder="Run command..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className="quick-open-results">
          {matches.map((command) => (
            <button
              key={command.label}
              className="quick-open-result"
              onClick={() => runCommand(command)}
            >
              <span>{command.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
