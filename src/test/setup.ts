import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Polyfill requestAnimationFrame / cancelAnimationFrame for jsdom
if (typeof globalThis.requestAnimationFrame === "undefined") {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0) as unknown as number;
  globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);
}

// Clean up the DOM after every test
afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Mock Tauri APIs globally — the Tauri runtime is not available in jsdom.
// Individual test files can override these with vi.mocked() as needed.
// ---------------------------------------------------------------------------

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: vi.fn(() => ({
    onDragDropEvent: vi.fn(() => Promise.resolve(vi.fn())),
  })),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(vi.fn())),
}));

// ---------------------------------------------------------------------------
// Mock mermaid — the real library requires a browser canvas context and web
// workers that are unavailable in jsdom.  Tests that import MarkdownRenderer
// can inspect these mocks directly via vi.mocked(mermaid).
// ---------------------------------------------------------------------------

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    run: vi.fn(() => Promise.resolve()),
  },
}));
