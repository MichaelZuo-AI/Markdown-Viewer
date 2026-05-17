import { useEffect, useMemo, useRef } from "react";
import { useAppStore } from "@/store/appStore";
import { filterProjectFiles } from "@/lib/projectIndex";
import * as fileOps from "@/lib/fileOps";

export default function QuickOpen() {
  const quickOpenOpen = useAppStore((s) => s.quickOpenOpen);
  const quickOpenQuery = useAppStore((s) => s.quickOpenQuery);
  const projectFiles = useAppStore((s) => s.projectFiles);
  const setQuickOpenOpen = useAppStore((s) => s.setQuickOpenOpen);
  const setQuickOpenQuery = useAppStore((s) => s.setQuickOpenQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(
    () => filterProjectFiles(projectFiles, quickOpenQuery).slice(0, 40),
    [projectFiles, quickOpenQuery],
  );

  useEffect(() => {
    if (quickOpenOpen) inputRef.current?.focus();
  }, [quickOpenOpen]);

  if (!quickOpenOpen) return null;

  const openFile = (path: string) => {
    setQuickOpenOpen(false);
    fileOps.openProjectFile(path);
  };

  return (
    <div className="overlay-backdrop" role="presentation">
      <div className="quick-open-panel" role="dialog" aria-label="Quick open">
        <input
          ref={inputRef}
          className="quick-open-input"
          placeholder="Open file..."
          value={quickOpenQuery}
          onChange={(e) => setQuickOpenQuery(e.target.value)}
        />
        <div className="quick-open-results">
          {matches.length === 0 ? (
            <div className="quick-open-empty">No files</div>
          ) : matches.map((file) => (
            <button
              key={file.path}
              className="quick-open-result"
              onClick={() => openFile(file.path)}
            >
              <span>{file.relativePath}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
