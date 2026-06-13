import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { tmpdir } from "os";
import {
  listFiles,
  copyFile,
  isLink,
  removeLink,
  symlinkDir,
  symlinkFile,
  isSymlink,
} from "../../packages/medical-protocol/src/files";

// ---------------------------------------------------------------------------
// Cross-platform regression tests for the installer's filesystem helpers.
//
// These lock in the Windows-safe behavior added for Windows support:
//   - symlinkDir uses a junction on win32 (no admin needed) instead of a "dir"
//     symlink, and detects/removes existing links junction-aware.
//   - symlinkFile falls back to a plain copy when Windows blocks file symlinks
//     with EPERM.
//   - isLink/removeLink treat both POSIX symlinks and Windows junctions as links
//     (lstat().isSymbolicLink() returns false for junctions).
//
// Windows-only branches are exercised on any platform by stubbing
// process.platform. Node ignores the symlinkSync `type` argument on POSIX, so
// the "junction" path still produces a working link here; the EPERM fallback is
// driven by a controllable fs.symlinkSync mock (vitest can't spy on the builtin
// fs namespace directly in ESM, so we mock the module).
// ---------------------------------------------------------------------------

// Mutable control for the mocked symlinkSync, shared with the hoisted mock factory.
const ctl = vi.hoisted(() => ({
  throwErr: null as Error | null,
  calls: [] as Array<[unknown, unknown, unknown]>,
}));

vi.mock("fs", async (importOriginal) => {
  const orig = await importOriginal<typeof import("fs")>();
  return {
    ...orig,
    symlinkSync: (target: fs.PathLike, p: fs.PathLike, type?: fs.symlink.Type | null) => {
      ctl.calls.push([target, p, type]);
      if (ctl.throwErr) throw ctl.throwErr;
      return orig.symlinkSync(target, p, type);
    },
  };
});

let dir: string;
const realPlatform = process.platform;

function setPlatform(value: NodeJS.Platform): void {
  Object.defineProperty(process, "platform", { value, configurable: true });
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(tmpdir(), "mp-files-"));
});

afterEach(() => {
  setPlatform(realPlatform);
  ctl.throwErr = null;
  ctl.calls.length = 0;
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("listFiles", () => {
  it("returns relative paths recursively, sorted", () => {
    fs.mkdirSync(path.join(dir, "a", "b"), { recursive: true });
    fs.writeFileSync(path.join(dir, "z.txt"), "z");
    fs.writeFileSync(path.join(dir, "a", "m.txt"), "m");
    fs.writeFileSync(path.join(dir, "a", "b", "c.txt"), "c");

    const result = listFiles(dir).map((p) => p.split(path.sep).join("/"));
    expect(result).toEqual(["a/b/c.txt", "a/m.txt", "z.txt"]);
  });
});

describe("copyFile", () => {
  it("copies content and creates missing parent directories", () => {
    const src = path.join(dir, "src.txt");
    fs.writeFileSync(src, "hello");
    const dest = path.join(dir, "nested", "deep", "out.txt");

    copyFile(src, dest);

    expect(fs.existsSync(dest)).toBe(true);
    expect(fs.readFileSync(dest, "utf8")).toBe("hello");
  });

  it("sets the executable bit on .sh and .mjs hooks (POSIX)", () => {
    if (process.platform === "win32") return; // chmod is a no-op on Windows
    const src = path.join(dir, "hook.mjs");
    fs.writeFileSync(src, "// hook", { mode: 0o644 });

    const shDest = path.join(dir, "out.sh");
    const mjsDest = path.join(dir, "out.mjs");
    copyFile(src, shDest);
    copyFile(src, mjsDest);

    expect(fs.statSync(shDest).mode & 0o100).toBe(0o100);
    expect(fs.statSync(mjsDest).mode & 0o100).toBe(0o100);
  });
});

describe("isLink / isSymlink", () => {
  it("returns true for a symlink and false for real files, dirs, and missing paths", () => {
    const realFile = path.join(dir, "real.txt");
    const realDir = path.join(dir, "realdir");
    const link = path.join(dir, "link");
    fs.writeFileSync(realFile, "x");
    fs.mkdirSync(realDir);
    fs.symlinkSync(realFile, link);

    expect(isLink(link)).toBe(true);
    expect(isLink(realFile)).toBe(false);
    expect(isLink(realDir)).toBe(false);
    expect(isLink(path.join(dir, "missing"))).toBe(false);
  });

  it("isSymlink is an alias of isLink", () => {
    expect(isSymlink).toBe(isLink);
  });
});

describe("removeLink", () => {
  it("removes a symlink without touching its target", () => {
    const target = path.join(dir, "target.txt");
    const link = path.join(dir, "link");
    fs.writeFileSync(target, "keep");
    fs.symlinkSync(target, link);

    removeLink(link);

    expect(fs.existsSync(link)).toBe(false);
    expect(fs.existsSync(target)).toBe(true);
    expect(fs.readFileSync(target, "utf8")).toBe("keep");
  });

  it("removes a dangling symlink", () => {
    const link = path.join(dir, "dangling");
    fs.symlinkSync(path.join(dir, "nope"), link);

    removeLink(link);

    expect(isLink(link)).toBe(false);
  });
});

describe("symlinkDir", () => {
  it("links a directory and exposes its contents", () => {
    const target = path.join(dir, "source");
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(target, "file.txt"), "data");
    const linkPath = path.join(dir, "linked");

    symlinkDir(target, linkPath);

    expect(isLink(linkPath)).toBe(true);
    expect(fs.readFileSync(path.join(linkPath, "file.txt"), "utf8")).toBe("data");
  });

  it("replaces an existing link instead of erroring", () => {
    const targetA = path.join(dir, "a");
    const targetB = path.join(dir, "b");
    fs.mkdirSync(targetA);
    fs.mkdirSync(targetB);
    fs.writeFileSync(path.join(targetB, "marker.txt"), "B");
    const linkPath = path.join(dir, "linked");

    symlinkDir(targetA, linkPath);
    symlinkDir(targetB, linkPath); // should not throw

    expect(fs.existsSync(path.join(linkPath, "marker.txt"))).toBe(true);
  });

  it("throws when the link path is a real directory", () => {
    const target = path.join(dir, "source");
    const linkPath = path.join(dir, "realdir");
    fs.mkdirSync(target);
    fs.mkdirSync(linkPath);

    expect(() => symlinkDir(target, linkPath)).toThrow(/not a symlink/);
  });

  it("requests a junction on win32 and still produces a working link", () => {
    setPlatform("win32");
    const target = path.join(dir, "source");
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(target, "file.txt"), "data");
    const linkPath = path.join(dir, "linked");

    symlinkDir(target, linkPath);

    // junction type requested on Windows (Node ignores the type arg on POSIX)
    expect(ctl.calls.at(-1)).toEqual([target, linkPath, "junction"]);
    expect(isLink(linkPath)).toBe(true);
    expect(fs.readFileSync(path.join(linkPath, "file.txt"), "utf8")).toBe("data");
  });

  it("requests a dir symlink on non-win32", () => {
    const target = path.join(dir, "source");
    fs.mkdirSync(target);
    const linkPath = path.join(dir, "linked");

    symlinkDir(target, linkPath);

    expect(ctl.calls.at(-1)).toEqual([target, linkPath, "dir"]);
  });
});

describe("symlinkFile", () => {
  it("links a file and replaces an existing link", () => {
    const targetA = path.join(dir, "a.txt");
    const targetB = path.join(dir, "b.txt");
    fs.writeFileSync(targetA, "A");
    fs.writeFileSync(targetB, "B");
    const linkPath = path.join(dir, "link.txt");

    symlinkFile(targetA, linkPath);
    expect(fs.readFileSync(linkPath, "utf8")).toBe("A");

    symlinkFile(targetB, linkPath); // replace, no throw
    expect(fs.readFileSync(linkPath, "utf8")).toBe("B");
  });

  it("falls back to a copy when Windows blocks the symlink with EPERM", () => {
    setPlatform("win32");
    ctl.throwErr = Object.assign(new Error("operation not permitted"), { code: "EPERM" });
    const target = path.join(dir, "target.txt");
    fs.writeFileSync(target, "payload");
    const linkPath = path.join(dir, "copied.txt");

    symlinkFile(target, linkPath);

    // copied, not linked
    expect(fs.existsSync(linkPath)).toBe(true);
    expect(isLink(linkPath)).toBe(false);
    expect(fs.readFileSync(linkPath, "utf8")).toBe("payload");
  });

  it("rethrows non-EPERM symlink errors", () => {
    ctl.throwErr = Object.assign(new Error("io error"), { code: "EIO" });
    const target = path.join(dir, "target.txt");
    fs.writeFileSync(target, "x");

    expect(() => symlinkFile(target, path.join(dir, "out.txt"))).toThrow(/io error/);
  });
});
