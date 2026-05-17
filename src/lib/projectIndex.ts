export type ProjectNodeType = "folder" | "file";

export interface ProjectFile {
  name: string;
  path: string;
  relativePath: string;
  content?: string;
}

export interface ProjectTreeNode {
  id: string;
  name: string;
  path: string;
  relativePath: string;
  type: ProjectNodeType;
  children: ProjectTreeNode[];
}

export interface ProjectSearchResult {
  filePath: string;
  relativePath: string;
  lineNumber: number;
  excerpt: string;
}

const MARKDOWN_EXTENSIONS = new Set(["md", "markdown", "txt"]);

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/");
}

function trimTrailingSlash(path: string): string {
  return normalizePath(path).replace(/\/+$/, "");
}

export function isMarkdownPath(path: string): boolean {
  const name = fileNameFromPath(path);
  const ext = name.includes(".") ? name.split(".").pop()?.toLowerCase() : "";
  return Boolean(ext && MARKDOWN_EXTENSIONS.has(ext));
}

export function fileNameFromPath(path: string): string {
  const normalized = normalizePath(path).replace(/\/+$/, "");
  return normalized.split("/").pop() || "Untitled";
}

export function relativePathFromRoot(rootPath: string, filePath: string): string {
  const root = trimTrailingSlash(rootPath);
  const file = normalizePath(filePath);
  if (file === root) return fileNameFromPath(file);
  if (file.startsWith(`${root}/`)) return file.slice(root.length + 1);
  return fileNameFromPath(file);
}

export function toProjectFile(rootPath: string, filePath: string, content?: string): ProjectFile {
  return {
    name: fileNameFromPath(filePath),
    path: normalizePath(filePath),
    relativePath: relativePathFromRoot(rootPath, filePath),
    ...(content !== undefined ? { content } : {}),
  };
}

function sortNodes(nodes: ProjectTreeNode[]): ProjectTreeNode[] {
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
  });
}

function getOrCreateFolder(
  parent: ProjectTreeNode,
  name: string,
  path: string,
  relativePath: string,
): ProjectTreeNode {
  const existing = parent.children.find((child) => child.type === "folder" && child.name === name);
  if (existing) return existing;

  const folder: ProjectTreeNode = {
    id: `folder:${relativePath || path}`,
    name,
    path,
    relativePath,
    type: "folder",
    children: [],
  };
  parent.children.push(folder);
  return folder;
}

export function buildProjectTree(rootPath: string, files: ProjectFile[]): ProjectTreeNode {
  const root = trimTrailingSlash(rootPath);
  const rootNode: ProjectTreeNode = {
    id: `folder:${root}`,
    name: fileNameFromPath(root),
    path: root,
    relativePath: "",
    type: "folder",
    children: [],
  };

  for (const file of files) {
    const parts = file.relativePath.split("/").filter(Boolean);
    if (parts.length === 0) continue;

    let parent = rootNode;
    let folderPath = root;
    const relativeParts: string[] = [];

    for (const part of parts.slice(0, -1)) {
      relativeParts.push(part);
      folderPath = `${folderPath}/${part}`;
      parent = getOrCreateFolder(parent, part, folderPath, relativeParts.join("/"));
    }

    parent.children.push({
      id: `file:${file.path}`,
      name: file.name,
      path: file.path,
      relativePath: file.relativePath,
      type: "file",
      children: [],
    });
  }

  const sortDeep = (node: ProjectTreeNode) => {
    sortNodes(node.children);
    node.children.forEach(sortDeep);
  };
  sortDeep(rootNode);

  return rootNode;
}

function fuzzyIncludes(value: string, query: string): boolean {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const target = value.toLowerCase();
  return tokens.every((token) => target.includes(token));
}

export function filterProjectFiles(files: ProjectFile[], query: string): ProjectFile[] {
  const trimmed = query.trim();
  if (!trimmed) return files;
  return files.filter((file) =>
    fuzzyIncludes(file.name, trimmed) || fuzzyIncludes(file.relativePath, trimmed),
  );
}

export function searchProjectFiles(files: ProjectFile[], query: string): ProjectSearchResult[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const results: ProjectSearchResult[] = [];

  for (const file of files) {
    if (!file.content) continue;
    const lines = file.content.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (!line.toLowerCase().includes(needle)) return;
      results.push({
        filePath: file.path,
        relativePath: file.relativePath,
        lineNumber: index + 1,
        excerpt: line.trim(),
      });
    });
  }

  return results;
}
