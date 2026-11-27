#!/usr/bin/env node
// Medical Protocol Hook: PreToolUse (Bash, PowerShell)
// Enforces patient data privacy by blocking commands that could exfiltrate data.
// Allows safe operations: npm install/dev, curl GET, git add/commit, tsc.
// Blocks: git push, curl POST, scp, nc, npm publish, and other outbound data commands.
//
// Cross-platform: pure Node (no bash/jq/grep), runs identically on Windows, macOS, Linux.
// Plugin version: no CLAUDE.md activation guard — plugin enabled = hooks active.

import { text } from "stream/consumers";

function deny(reason) {
  const out = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        "PRIVACY GUARD: " +
        reason +
        " All patient data must stay on this machine. If the user explicitly requested this action, ask them to confirm they understand the privacy implications.",
    },
  };
  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
  process.exit(0);
}

let input = {};
try {
  // Not readFileSync(0): on a pipe it throws EAGAIN for large input, and the guard would let the call through.
  input = JSON.parse((process.stdin.isTTY ? "" : await text(process.stdin)) || "{}");
} catch {
  input = {};
}

const toolName = input.tool_name || "";
// Only guard shell commands
if (!/^(Bash|PowerShell)$/.test(toolName)) process.exit(0);

const command = (input.tool_input && input.tool_input.command) || "";
// Normalize: lowercase + collapse whitespace, matching the original shell behavior.
const cmd = command.toLowerCase().replace(/\s+/g, " ");

// ─── Block: git push (any form) ───
if (/\bgit\s+push\b/.test(cmd)) {
  deny("Blocked 'git push'. The project may contain patient data or references to local patient records.");
}

// ─── Block: npm/yarn/pnpm publish ───
if (/\b(npm|yarn|pnpm)\s+publish\b/.test(cmd)) {
  deny("Blocked 'publish'. Publishing could expose patient data or clinical configurations.");
}

// ─── Block: outbound data transfer commands ───
// scp, sftp, ftp
if (/\b(scp|sftp|ftp)\s/.test(cmd)) {
  deny("Blocked file transfer command. Patient data must not be sent to external systems.");
}
// nc/ncat/netcat
if (/\b(nc|ncat|netcat)\s/.test(cmd)) {
  deny("Blocked netcat. Raw network connections could leak patient data.");
}
// rsync to remote
if (/\brsync\s.*:/.test(cmd)) {
  deny("Blocked rsync to remote. Patient data must not be synced to external systems.");
}

// ─── Block: curl/wget/httpie with data-sending methods ───
// Block POST, PUT, PATCH, DELETE (data-sending HTTP methods). Allow GET.
if (/\bcurl\b/.test(cmd)) {
  if (
    /(\s|^)(-x\s*(post|put|patch|delete)|--request\s*(post|put|patch|delete)|-d\s|--data|--data-raw|--data-binary|--data-urlencode|-f\s|--form|--upload-file)/.test(
      cmd,
    )
  ) {
    deny("Blocked curl with outbound data. Use curl only for fetching (GET).");
  }
}
if (/\bwget\s.*--post/.test(cmd)) {
  deny("Blocked wget POST. Patient data must not be sent externally.");
}
if (/\bhttpie?\b.*\b(post|put|patch|delete)\b/.test(cmd)) {
  deny("Blocked HTTP client with outbound data method.");
}

// ─── Block: PowerShell web cmdlets with data-sending methods ───
// Bare `curl` is an alias of Invoke-WebRequest in Windows PowerShell 5, so it gets these rules too.
// Parameter names may be shortened (-Me, -Bo, -InF), so prefixes are matched.
if (/\b(invoke-webrequest|invoke-restmethod|iwr|irm|curl)\b/.test(cmd)) {
  if (/\s-me\w*[\s:]+(?!['"]?(get|head)\b)|\s-(bod?y?|inf\w*|form?)\b/.test(cmd)) {
    deny("Blocked PowerShell web request with outbound data. Use it only for fetching (GET).");
  }
}
// [System.Net.WebClient] UploadFile/UploadData/UploadString/UploadValues
if (/\.upload(file|data|string|values)/.test(cmd)) {
  deny("Blocked WebClient upload. Patient data must not be sent externally.");
}
if (/\bstart-bitstransfer\b.*\bupload\b/.test(cmd)) {
  deny("Blocked BITS upload. Patient data must not be sent externally.");
}
if (/\bsend-mailmessage\b/.test(cmd)) {
  deny("Blocked Send-MailMessage. Patient data must not be sent by email.");
}
// Environment or file content piped into a PowerShell network command
if (
  /(env:|\b(get-content|gc)\b).*\|.*\b(invoke-webrequest|invoke-restmethod|iwr|irm|curl|wget|start-bitstransfer|send-mailmessage)\b/.test(
    cmd,
  )
) {
  deny("Blocked environment or file content piped to a network command.");
}

// ─── Block: docker push ───
if (/\bdocker\s+push\b/.test(cmd)) {
  deny("Blocked 'docker push'. Container images may contain patient data or clinical configs.");
}

// ─── Block: ssh (except safe local key management) ───
// Whitelist: ssh-keygen, ssh-add. Block all other ssh usage.
if (/\bssh\b/.test(cmd)) {
  if (!/\bssh-(keygen|add)\b/.test(cmd)) {
    deny("Blocked SSH connection. Remote connections could exfiltrate patient data. Only ssh-keygen and ssh-add are allowed.");
  }
}

// ─── Block: base64 piped to network commands (encoding + exfil pattern) ───
if (/base64.*\|\s*(curl|wget|nc|ssh)/.test(cmd)) {
  deny("Blocked encoded data exfiltration pattern.");
}

// ─── Block: environment variable dumps to external (could contain secrets) ───
if (/\benv\b.*\|\s*(curl|wget|nc)/.test(cmd)) {
  deny("Blocked environment variable exfiltration.");
}

// ─── Everything else: allow ───
process.exit(0);
