/**
 * Tests for src/lib/fileOps.ts
 *
 * Strategy: Both functions are thin orchestrators that call Tauri APIs and then
 * delegate to the Zustand store. We mock all three external pieces:
 *   - @tauri-apps/plugin-dialog  (open)
 *   - @tauri-apps/plugin-fs      (readTextFile)
 *   - @/store/appStore           (useAppStore.getState().loadMarkdown)
 *
 * This keeps the tests deterministic and free of native Tauri runtime.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { open } from "@tauri-apps/plugin-dialog";
import { readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { openMarkdownFile, openProjectFile, openProjectFolder, readDroppedFile } from "@/lib/fileOps";
import { useAppStore } from "@/store/appStore";

// Vitest already hoisted vi.mock calls (from setup.ts) for the Tauri modules.
// Cast the auto-mocked functions so we can call mockResolvedValueOnce etc.
const mockOpen = open as Mock;
const mockReadDir = readDir as Mock;
const mockReadTextFile = readTextFile as Mock;

// We spy on the store's loadMarkdown so we can assert it was called correctly
// without running through the full Zustand + parseMarkdown path.
let mockLoadMarkdown: ReturnType<typeof vi.fn>;
let mockSetProject: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();

  // Replace the store's loadMarkdown with a spy for each test
  mockLoadMarkdown = vi.fn();
  mockSetProject = vi.fn();
  vi.spyOn(useAppStore, "getState").mockReturnValue({
    ...useAppStore.getState(),
    loadMarkdown: mockLoadMarkdown,
    setProject: mockSetProject,
  } as ReturnType<typeof useAppStore.getState>);
});

// ---------------------------------------------------------------------------

describe("openMarkdownFile", () => {
  it("calls open() with multiple:false", async () => {
    mockOpen.mockResolvedValueOnce(null);

    await openMarkdownFile();

    expect(mockOpen).toHaveBeenCalledOnce();
    expect(mockOpen).toHaveBeenCalledWith(
      expect.objectContaining({ multiple: false }),
    );
  });

  it("passes markdown file filters to the dialog", async () => {
    mockOpen.mockResolvedValueOnce(null);

    await openMarkdownFile();

    expect(mockOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.arrayContaining([
          expect.objectContaining({
            extensions: expect.arrayContaining(["md", "markdown", "txt"]),
          }),
        ]),
      }),
    );
  });

  it("returns early without reading or loading when dialog is cancelled (null)", async () => {
    mockOpen.mockResolvedValueOnce(null);

    await openMarkdownFile();

    expect(mockReadTextFile).not.toHaveBeenCalled();
    expect(mockLoadMarkdown).not.toHaveBeenCalled();
  });

  it("reads the selected file path when the user picks a file", async () => {
    const filePath = "/home/user/docs/readme.md";
    mockOpen.mockResolvedValueOnce(filePath);
    mockReadTextFile.mockResolvedValueOnce("# Hello");

    await openMarkdownFile();

    expect(mockReadTextFile).toHaveBeenCalledOnce();
    expect(mockReadTextFile).toHaveBeenCalledWith(filePath);
  });

  it("calls loadMarkdown with the file content, name, and path", async () => {
    const filePath = "/home/user/notes.md";
    const content = "# My Notes\n\nsome text";
    mockOpen.mockResolvedValueOnce(filePath);
    mockReadTextFile.mockResolvedValueOnce(content);

    await openMarkdownFile();

    expect(mockLoadMarkdown).toHaveBeenCalledOnce();
    expect(mockLoadMarkdown).toHaveBeenCalledWith(content, "notes.md", filePath);
  });

  it("extracts the file name from the last path segment", async () => {
    const filePath = "/a/b/c/deep-document.md";
    mockOpen.mockResolvedValueOnce(filePath);
    mockReadTextFile.mockResolvedValueOnce("content");

    await openMarkdownFile();

    const [, name] = mockLoadMarkdown.mock.calls[0] as [string, string, string];
    expect(name).toBe("deep-document.md");
  });

  it("uses 'Untitled' as name when path has no segments", async () => {
    // edge case: a path that ends with a slash → pop() returns ""
    const filePath = "/";
    mockOpen.mockResolvedValueOnce(filePath);
    mockReadTextFile.mockResolvedValueOnce("content");

    await openMarkdownFile();

    const [, name] = mockLoadMarkdown.mock.calls[0] as [string, string, string];
    expect(name).toBe("Untitled");
  });

  it("passes the full path as the third argument to loadMarkdown", async () => {
    const filePath = "/projects/work/specs.md";
    mockOpen.mockResolvedValueOnce(filePath);
    mockReadTextFile.mockResolvedValueOnce("spec content");

    await openMarkdownFile();

    const [, , path] = mockLoadMarkdown.mock.calls[0] as [string, string, string];
    expect(path).toBe(filePath);
  });
});

// ---------------------------------------------------------------------------

describe("readDroppedFile", () => {
  it("reads the given file path using readTextFile", async () => {
    const filePath = "/home/user/dragged.md";
    mockReadTextFile.mockResolvedValueOnce("# Dragged");

    await readDroppedFile(filePath);

    expect(mockReadTextFile).toHaveBeenCalledOnce();
    expect(mockReadTextFile).toHaveBeenCalledWith(filePath);
  });

  it("calls loadMarkdown with the file content, name, and path", async () => {
    const filePath = "/home/user/document.md";
    const content = "## Hello from drag";
    mockReadTextFile.mockResolvedValueOnce(content);

    await readDroppedFile(filePath);

    expect(mockLoadMarkdown).toHaveBeenCalledOnce();
    expect(mockLoadMarkdown).toHaveBeenCalledWith(content, "document.md", filePath);
  });

  it("extracts the file name from the last segment of the file path", async () => {
    const filePath = "/a/b/c/nested-file.md";
    mockReadTextFile.mockResolvedValueOnce("content");

    await readDroppedFile(filePath);

    const [, name] = mockLoadMarkdown.mock.calls[0] as [string, string, string];
    expect(name).toBe("nested-file.md");
  });

  it("uses 'Untitled' when the path produces an empty segment", async () => {
    const filePath = "/";
    mockReadTextFile.mockResolvedValueOnce("content");

    await readDroppedFile(filePath);

    const [, name] = mockLoadMarkdown.mock.calls[0] as [string, string, string];
    expect(name).toBe("Untitled");
  });

  it("passes the full original path as the third argument", async () => {
    const filePath = "/users/mike/file.md";
    mockReadTextFile.mockResolvedValueOnce("hello");

    await readDroppedFile(filePath);

    const [, , path] = mockLoadMarkdown.mock.calls[0] as [string, string, string];
    expect(path).toBe(filePath);
  });

  it("handles Windows-style paths with backslashes gracefully", async () => {
    // Tauri on macOS uses forward slashes, but defensive test for path parsing
    const filePath = "/some/path/windows-compat.md";
    mockReadTextFile.mockResolvedValueOnce("windows content");

    await readDroppedFile(filePath);

    expect(mockLoadMarkdown).toHaveBeenCalledOnce();
  });

  it("does not call the dialog open() at all", async () => {
    mockReadTextFile.mockResolvedValueOnce("content");

    await readDroppedFile("/some/file.md");

    expect(mockOpen).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------

describe("openProjectFolder", () => {
  it("opens a native directory picker", async () => {
    mockOpen.mockResolvedValueOnce(null);

    await openProjectFolder();

    expect(mockOpen).toHaveBeenCalledWith(
      expect.objectContaining({ directory: true, multiple: false }),
    );
  });

  it("returns early when directory picker is cancelled", async () => {
    mockOpen.mockResolvedValueOnce(null);

    await openProjectFolder();

    expect(mockReadDir).not.toHaveBeenCalled();
    expect(mockSetProject).not.toHaveBeenCalled();
  });

  it("recursively indexes supported Markdown files and ignores unsupported files", async () => {
    mockOpen.mockResolvedValueOnce("/root/docs");
    mockReadDir.mockImplementation(async (path: string) => {
      if (path === "/root/docs") {
        return [
          { name: "index.md", isFile: true, isDirectory: false },
          { name: "assets", isFile: false, isDirectory: true },
          { name: "nested", isFile: false, isDirectory: true },
        ];
      }
      if (path === "/root/docs/assets") {
        return [{ name: "photo.png", isFile: true, isDirectory: false }];
      }
      if (path === "/root/docs/nested") {
        return [
          { name: "plan.markdown", isFile: true, isDirectory: false },
          { name: "notes.txt", isFile: true, isDirectory: false },
          { name: "app.ts", isFile: true, isDirectory: false },
        ];
      }
      return [];
    });
    mockReadTextFile.mockImplementation(async (path: string) => `content for ${path}`);

    await openProjectFolder();

    expect(mockSetProject).toHaveBeenCalledOnce();
    const [rootPath, files] = mockSetProject.mock.calls[0] as [string, Array<{ relativePath: string; content?: string }>];
    expect(rootPath).toBe("/root/docs");
    expect(files.map((file) => file.relativePath)).toEqual([
      "index.md",
      "nested/notes.txt",
      "nested/plan.markdown",
    ]);
    expect(files[0].content).toBe("content for /root/docs/index.md");
  });
});

// ---------------------------------------------------------------------------

describe("openProjectFile", () => {
  it("reads the selected project file and loads it into the editor", async () => {
    mockReadTextFile.mockResolvedValueOnce("# Project file");

    await openProjectFile("/root/docs/nested/plan.md");

    expect(mockReadTextFile).toHaveBeenCalledWith("/root/docs/nested/plan.md");
    expect(mockLoadMarkdown).toHaveBeenCalledWith(
      "# Project file",
      "plan.md",
      "/root/docs/nested/plan.md",
    );
  });
});
