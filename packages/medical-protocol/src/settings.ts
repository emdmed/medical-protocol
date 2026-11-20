import * as fs from "fs";
import * as path from "path";
import { getHooksDir, getSettingsPath } from "./files";

type HookGroup = { matcher?: string; hooks: { type: string; command: string; timeout?: number }[] };
type Hooks = Record<string, HookGroup[]>;

// Plugin hooks run from the plugin root; a local install runs them from the project's .claude/
const localCommand = (command: string): string => command.replaceAll("${CLAUDE_PLUGIN_ROOT}", "${CLAUDE_PROJECT_DIR}/.claude");
const scriptOf = (command: string): string | undefined => command.match(/\/hooks\/([\w.-]+\.mjs)/)?.[1];

const readSettings = (file: string): Record<string, unknown> => {
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    // never overwrite settings we can't read: they hold the doctor's own permissions and hooks
    throw new Error(`Can't parse ${file}. Fix or remove it, then run this again.`);
  }
};

const pluginHooks = (pluginDir: string): Hooks => {
  const file = path.join(pluginDir, "hooks", "hooks.json");
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf-8")).hooks ?? {}) : {};
};

/** Merges the plugin's permissions and hooks into <project>/.claude/settings.json. Our hooks are replaced, the doctor's kept. */
export function mergeSettings(baseDir: string, pluginDir: string): void {
  const target = getSettingsPath(baseDir);
  const existing = readSettings(target);

  const bundledPath = path.join(pluginDir, "settings.json");
  const bundled = fs.existsSync(bundledPath) ? JSON.parse(fs.readFileSync(bundledPath, "utf-8")) : {};
  const perms = (existing.permissions ?? {}) as Record<string, string[]>;
  for (const key of ["allow", "deny"] as const) {
    const merged = [...new Set([...(perms[key] ?? []), ...(bundled.permissions?.[key] ?? [])])];
    if (merged.length) perms[key] = merged;
  }
  existing.permissions = perms;

  const source = pluginHooks(pluginDir);
  const ours = new Set(fs.readdirSync(path.join(pluginDir, "hooks")).filter((f) => f.endsWith(".mjs")));
  const isOurs = (command: string) => command.includes("/.claude/hooks/") && ours.has(scriptOf(command) ?? "");
  const hooks = (existing.hooks ?? {}) as Hooks;
  for (const event of Object.keys(hooks)) {
    hooks[event] = hooks[event]!.map((g) => ({ ...g, hooks: g.hooks.filter((h) => !isOurs(h.command)) })).filter((g) => g.hooks.length);
    if (!hooks[event]!.length) delete hooks[event];
  }
  for (const [event, groups] of Object.entries(source)) {
    hooks[event] = [...(hooks[event] ?? []), ...groups.map((g) => ({ ...g, hooks: g.hooks.map((h) => ({ ...h, command: localCommand(h.command) })) }))];
  }
  existing.hooks = hooks;

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(existing, null, 2) + "\n");
}

/** Every plugin hook must be registered in settings.json and its script present, or that safety check silently doesn't run. */
export function hookIssues(baseDir: string, pluginDir: string): string[] {
  let settings: Record<string, unknown>;
  try {
    settings = readSettings(getSettingsPath(baseDir));
  } catch (e) {
    return [(e as Error).message];
  }
  const registered = (settings.hooks ?? {}) as Hooks;
  const issues: string[] = [];
  for (const [event, groups] of Object.entries(pluginHooks(pluginDir))) {
    for (const g of groups) {
      for (const h of g.hooks) {
        const command = localCommand(h.command);
        const script = scriptOf(command) ?? command;
        if (!(registered[event] ?? []).some((r) => r.matcher === g.matcher && r.hooks.some((x) => x.command === command)))
          issues.push(`Safety hook not active: ${script} (${event}). Run 'medical-protocol update'.`);
        if (scriptOf(command) && !fs.existsSync(path.join(getHooksDir(baseDir), script)))
          issues.push(`Safety hook file missing: .claude/hooks/${script}. Run 'medical-protocol update'.`);
      }
    }
  }
  return [...new Set(issues)];
}
