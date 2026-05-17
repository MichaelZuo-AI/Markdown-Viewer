import { useAppStore } from "@/store/appStore";
import { exportToHtml } from "@/lib/exportOps";
import { exportToPdf } from "@/lib/exportOps";

export default function Toolbar() {
  const fileName = useAppStore((s) => s.fileName);
  const wordCount = useAppStore((s) => s.wordCount);
  const readingTime = useAppStore((s) => s.readingTime);
  const theme = useAppStore((s) => s.theme);
  const editMode = useAppStore((s) => s.editMode);
  const dirty = useAppStore((s) => s.dirty);
  const keybindingMode = useAppStore((s) => s.keybindingMode);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const toggleEditMode = useAppStore((s) => s.toggleEditMode);
  const toggleSearch = useAppStore((s) => s.toggleSearch);
  const setPreferencesOpen = useAppStore((s) => s.setPreferencesOpen);
  const cycleKeybindingMode = useAppStore((s) => s.cycleKeybindingMode);
  const newMarkdownFile = useAppStore((s) => s.newMarkdownFile);
  const zoom = useAppStore((s) => s.zoom);

  const statsText =
    wordCount > 0
      ? `${wordCount.toLocaleString()} words \u00B7 ${readingTime} min read`
      : "";
  const keybindingLabel =
    keybindingMode === "vim" ? "VIM" : keybindingMode === "emacs" ? "EMA" : "STD";

  return (
    <div className="toolbar" data-tauri-drag-region>
      <div className="toolbar-group toolbar-primary">
        <button type="button" className="tb-btn" title="Toggle sidebar" aria-label="Toggle sidebar" onClick={toggleSidebar}>
          &#x2630;
        </button>
        <button type="button" className="tb-btn" title="New Markdown" aria-label="New Markdown" onClick={newMarkdownFile}>
          +
        </button>
      </div>

      <div className="toolbar-document">
        <span className="file-name">
          {dirty ? "\u25CF " : ""}{fileName}
        </span>
        {statsText && <span className="word-count">{statsText}</span>}
      </div>

      <div className="toolbar-actions">
        <div className="toolbar-group">
          <button type="button" className="tb-btn" title="Search" aria-label="Search" onClick={toggleSearch}>
            &#x1F50D;
          </button>
          <button type="button" className="tb-btn" title="Preferences" aria-label="Preferences" onClick={() => setPreferencesOpen(true)}>
            &#9881;
          </button>
          <button
            type="button"
            className={`tb-btn${editMode ? " tb-btn-active" : ""}`}
            title="Toggle edit mode"
            aria-label="Toggle edit mode"
            onClick={toggleEditMode}
          >
            &#x270E;
          </button>
        </div>
        <div className="toolbar-group">
          <button type="button" className="tb-btn" title="Export HTML" aria-label="Export HTML" onClick={exportToHtml}>
            &#x2913;
          </button>
          <button type="button" className="tb-btn tb-btn-text" title="Export PDF" aria-label="Export PDF" onClick={exportToPdf}>
            PDF
          </button>
        </div>
        {editMode && (
          <div className="toolbar-group toolbar-keybinding">
            <button
              type="button"
              className="tb-btn tb-btn-text"
              title={`Keybindings: ${keybindingMode}`}
              aria-label={`Keybindings: ${keybindingMode}`}
              onClick={cycleKeybindingMode}
            >
              {keybindingLabel}
            </button>
          </div>
        )}
        <div className="toolbar-group">
          <button type="button" className="tb-btn" title="Zoom in" aria-label="Zoom in" onClick={() => zoom(1)}>
            A+
          </button>
          <button type="button" className="tb-btn" title="Zoom out" aria-label="Zoom out" onClick={() => zoom(-1)}>
            A-
          </button>
          <button type="button" className="tb-btn" title="Toggle theme" aria-label="Toggle theme" onClick={toggleTheme}>
            {theme === "dark" ? "\u2600" : "\uD83C\uDF19"}
          </button>
        </div>
      </div>
    </div>
  );
}
