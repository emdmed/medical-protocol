import { spawn, type ChildProcess } from "node:child_process";

// cmd.exe + C runtime quoting: wrap in quotes, double embedded quotes and the backslashes before a quote
const quoteWin = (arg: string): string => `"${arg.replace(/(\\*)"/g, '$1$1""').replace(/\\+$/, "$&$&")}"`;

/**
 * Command, args and shell flag to start `claude`. On Windows claude can be claude.cmd, which only starts through a shell.
 * Callers pass constant args only (plus this script's own path); note text goes through stdin. Never put user text in args: on win32 they reach cmd.exe.
 */
export const claudeCommand = (args: string[], platform: string = process.platform): { command: string; args: string[]; shell: boolean } =>
  platform === "win32"
    ? // one command string: Node warns when args are passed with shell:true
      // shortcut: %VAR% inside an arg is still expanded by cmd.exe, matters only if the install path has % in it
      { command: ["claude", ...args.map(quoteWin)].join(" "), args: [], shell: true }
    : { command: "claude", args, shell: false };

/** Stop a claude run. On Windows the child is cmd.exe, so kill() would leave claude itself running. */
export const killClaude = (child: ChildProcess, platform: string = process.platform): void => {
  if (platform === "win32" && child.pid) spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  else child.kill();
};
