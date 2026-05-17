import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/appStore";
import * as fileOps from "@/lib/fileOps";

export default function GlobalSearch() {
  const globalSearchOpen = useAppStore((s) => s.globalSearchOpen);
  const globalSearchQuery = useAppStore((s) => s.globalSearchQuery);
  const projectSearchResults = useAppStore((s) => s.projectSearchResults);
  const setGlobalSearchOpen = useAppStore((s) => s.setGlobalSearchOpen);
  const setGlobalSearchQuery = useAppStore((s) => s.setGlobalSearchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (globalSearchOpen) inputRef.current?.focus();
  }, [globalSearchOpen]);

  if (!globalSearchOpen) return null;

  const openResult = (filePath: string) => {
    setGlobalSearchOpen(false);
    fileOps.openProjectFile(filePath);
  };

  return (
    <div className="overlay-backdrop" role="presentation">
      <div className="quick-open-panel" role="dialog" aria-label="Global search">
        <input
          ref={inputRef}
          className="quick-open-input"
          placeholder="Search project..."
          value={globalSearchQuery}
          onChange={(e) => setGlobalSearchQuery(e.target.value)}
        />
        <div className="quick-open-results">
          {projectSearchResults.length === 0 ? (
            <div className="quick-open-empty">No matches</div>
          ) : projectSearchResults.map((result) => (
            <button
              key={`${result.filePath}:${result.lineNumber}:${result.excerpt}`}
              className="global-search-result"
              aria-label={`${result.relativePath} line ${result.lineNumber}`}
              onClick={() => openResult(result.filePath)}
            >
              <span className="global-search-path">
                <span>{result.relativePath}</span>
                <span>line {result.lineNumber}</span>
              </span>
              <span className="global-search-excerpt">{result.excerpt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
