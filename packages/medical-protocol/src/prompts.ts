import * as p from "@clack/prompts";

export function isInteractive(opts: { yes?: boolean; json?: boolean }): boolean {
  return !opts.yes && !opts.json && !!process.stdin.isTTY;
}

export async function selectInstallMode(): Promise<"copy" | "link" | "cancel"> {
  const result = await p.select({
    message: "How would you like to install?",
    options: [
      { value: "copy" as const, label: "Copy files", hint: "recommended" },
      { value: "link" as const, label: "Symlink", hint: "for development" },
    ],
  });
  if (p.isCancel(result)) return "cancel";
  return result;
}

export async function confirmAlreadyInstalled(): Promise<"update" | "reinstall" | "cancel"> {
  const result = await p.select({
    message: "Plugin already installed. What would you like to do?",
    options: [
      { value: "update" as const, label: "Update to latest" },
      { value: "reinstall" as const, label: "Reinstall (overwrite)" },
      { value: "cancel" as const, label: "Cancel" },
    ],
  });
  if (p.isCancel(result)) return "cancel";
  return result;
}

export async function promptSourcePath(): Promise<string | null> {
  const result = await p.text({
    message: "Path to repo clone:",
    placeholder: "~/.medical-protocol",
  });
  if (p.isCancel(result)) return null;
  return result || null;
}

export async function confirmOverwriteModified(files: string[]): Promise<boolean> {
  const list = files.map((f) => `  - ${f}`).join("\n");
  p.log.warn(`Locally modified files:\n${list}`);
  const result = await p.confirm({
    message: "Overwrite these files with the latest version?",
  });
  if (p.isCancel(result)) return false;
  return result;
}
