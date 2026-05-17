import { open, save } from "@tauri-apps/plugin-dialog";
import { readDir, readTextFile, writeTextFile, type DirEntry } from "@tauri-apps/plugin-fs";
import { useAppStore } from "@/store/appStore";
import { isMarkdownPath, toProjectFile, type ProjectFile } from "@/lib/projectIndex";

function extractFileName(path: string): string {
  return path.split(/[/\\]/).pop() || "Untitled";
}

function joinPath(dir: string, name: string): string {
  return `${dir.replace(/[/\\]+$/, "")}/${name}`;
}

function isDirectoryEntry(entry: DirEntry): boolean {
  return Boolean(entry.isDirectory);
}

function isFileEntry(entry: DirEntry): boolean {
  return Boolean(entry.isFile);
}

/**
 * Opens a native file dialog and loads the selected markdown file.
 */
export async function openMarkdownFile() {
  try {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
    });
    if (!selected) return;

    const path = selected;
    const content = await readTextFile(path);
    const name = extractFileName(path);
    useAppStore.getState().loadMarkdown(content, name, path);
  } catch (err) {
    console.error("Failed to open file:", err);
  }
}

/**
 * Reads a file from a drag-and-drop file path (Tauri gives us the path directly).
 */
export async function readDroppedFile(filePath: string) {
  try {
    const content = await readTextFile(filePath);
    const name = extractFileName(filePath);
    useAppStore.getState().loadMarkdown(content, name, filePath);
  } catch (err) {
    console.error("Failed to read dropped file:", err);
  }
}

async function collectProjectFiles(rootPath: string, dirPath: string): Promise<ProjectFile[]> {
  const entries = await readDir(dirPath);
  const files: ProjectFile[] = [];

  for (const entry of entries) {
    const path = joinPath(dirPath, entry.name);
    if (isDirectoryEntry(entry)) {
      files.push(...await collectProjectFiles(rootPath, path));
      continue;
    }
    if (!isFileEntry(entry) || !isMarkdownPath(path)) continue;

    let content = "";
    try {
      content = await readTextFile(path);
    } catch {
      // Keep the file indexed even if content cannot be read for search.
    }
    files.push(toProjectFile(rootPath, path, content));
  }

  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath, undefined, {
    numeric: true,
    sensitivity: "base",
  }));
}

/**
 * Opens a native directory dialog, indexes supported Markdown/text files, and
 * stores the project in app state for file tree, quick-open, and search.
 */
export async function openProjectFolder() {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
    });
    if (!selected || Array.isArray(selected)) return;

    const files = await collectProjectFiles(selected, selected);
    useAppStore.getState().setProject(selected, files);
  } catch (err) {
    console.error("Failed to open project folder:", err);
    useAppStore.getState().showToast("Failed to open folder. Please try again.");
  }
}

/**
 * Opens an already-indexed project file from the sidebar/quick-open/search UI.
 */
export async function openProjectFile(filePath: string) {
  try {
    const content = await readTextFile(filePath);
    useAppStore.getState().loadMarkdown(content, extractFileName(filePath), filePath);
  } catch (err) {
    console.error("Failed to open project file:", err);
    useAppStore.getState().showToast("Failed to open file. Please try again.");
  }
}

/**
 * Saves the current markdown content to disk.
 * If no filePath exists, opens a Save dialog first.
 */
export async function saveMarkdownFile() {
  const store = useAppStore.getState();
  const tabId = store.activeTabId;
  let path = store.filePath;

  if (!path) {
    const selected = await save({
      filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
      defaultPath: store.fileName !== "No file opened" ? store.fileName : "untitled.md",
    });
    if (!selected) return;
    path = selected;
  }

  try {
    await writeTextFile(path, store.markdownContent);
    const name = extractFileName(path);
    useAppStore.getState().markTabSaved(tabId, path, name);
  } catch (err) {
    console.error("Failed to save file:", err);
    useAppStore.getState().showToast("Failed to save file. Please try again.");
  }
}
