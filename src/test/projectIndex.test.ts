import { describe, expect, it } from "vitest";
import {
  buildProjectTree,
  fileNameFromPath,
  filterProjectFiles,
  isMarkdownPath,
  relativePathFromRoot,
  searchProjectFiles,
  toProjectFile,
} from "@/lib/projectIndex";

describe("projectIndex — path helpers", () => {
  it("accepts Markdown and text file extensions case-insensitively", () => {
    expect(isMarkdownPath("/notes/idea.md")).toBe(true);
    expect(isMarkdownPath("/notes/idea.MARKDOWN")).toBe(true);
    expect(isMarkdownPath("/notes/plain.TXT")).toBe(true);
  });

  it("rejects unsupported file extensions", () => {
    expect(isMarkdownPath("/notes/image.png")).toBe(false);
    expect(isMarkdownPath("/notes/archive.pdf")).toBe(false);
    expect(isMarkdownPath("/notes/README")).toBe(false);
  });

  it("extracts a filename from Unix and Windows style paths", () => {
    expect(fileNameFromPath("/Users/mike/docs/readme.md")).toBe("readme.md");
    expect(fileNameFromPath("C:\\Users\\mike\\docs\\readme.md")).toBe("readme.md");
  });

  it("calculates a stable relative path from a project root", () => {
    expect(relativePathFromRoot("/Users/mike/docs", "/Users/mike/docs/a/b.md")).toBe("a/b.md");
    expect(relativePathFromRoot("/Users/mike/docs/", "/Users/mike/docs/a/b.md")).toBe("a/b.md");
  });
});

describe("projectIndex — tree and quick open", () => {
  const rootPath = "/Users/mike/notes";
  const files = [
    toProjectFile(rootPath, "/Users/mike/notes/inbox.md"),
    toProjectFile(rootPath, "/Users/mike/notes/projects/mikedown.md"),
    toProjectFile(rootPath, "/Users/mike/notes/projects/v0.19/plan.markdown"),
  ];

  it("builds a nested folder tree from flat project files", () => {
    const tree = buildProjectTree(rootPath, files);

    expect(tree.name).toBe("notes");
    expect(tree.children.map((child) => child.name)).toEqual(["projects", "inbox.md"]);
    const projects = tree.children.find((child) => child.name === "projects");
    expect(projects?.type).toBe("folder");
    expect(projects?.children.map((child) => child.name)).toEqual(["v0.19", "mikedown.md"]);
  });

  it("sorts folders before files inside each folder", () => {
    const tree = buildProjectTree(rootPath, files);
    const projects = tree.children.find((child) => child.name === "projects");

    expect(projects?.children.map((child) => child.name)).toEqual(["v0.19", "mikedown.md"]);
    const nested = projects?.children.find((child) => child.name === "v0.19");
    expect(nested?.children.map((child) => child.name)).toEqual(["plan.markdown"]);
  });

  it("filters quick-open matches by filename or relative path", () => {
    expect(filterProjectFiles(files, "mike").map((file) => file.relativePath)).toEqual([
      "projects/mikedown.md",
    ]);
    expect(filterProjectFiles(files, "v0 plan").map((file) => file.relativePath)).toEqual([
      "projects/v0.19/plan.markdown",
    ]);
  });

  it("returns all files for an empty quick-open query", () => {
    expect(filterProjectFiles(files, "").map((file) => file.relativePath)).toEqual([
      "inbox.md",
      "projects/mikedown.md",
      "projects/v0.19/plan.markdown",
    ]);
  });
});

describe("projectIndex — text search", () => {
  it("returns case-insensitive line results with trimmed excerpts", () => {
    const files = [
      {
        ...toProjectFile("/root", "/root/a.md"),
        content: "# Alpha\n\nThis line talks about MikeDown file workflow.",
      },
      {
        ...toProjectFile("/root", "/root/b.md"),
        content: "Nothing here\nAnother mikedown mention",
      },
    ];

    const results = searchProjectFiles(files, "mikedown");

    expect(results).toEqual([
      expect.objectContaining({
        filePath: "/root/a.md",
        relativePath: "a.md",
        lineNumber: 3,
        excerpt: "This line talks about MikeDown file workflow.",
      }),
      expect.objectContaining({
        filePath: "/root/b.md",
        relativePath: "b.md",
        lineNumber: 2,
        excerpt: "Another mikedown mention",
      }),
    ]);
  });

  it("returns no results for an empty search query", () => {
    const files = [{ ...toProjectFile("/root", "/root/a.md"), content: "hello" }];
    expect(searchProjectFiles(files, "")).toEqual([]);
  });
});
