#!/bin/bash
set -e

# Medical Protocol — Installer
# Installs Node.js, Claude Code, and sets up a clinic project.
# Run with: curl -fsSL https://medical-protocol-workflows.vercel.app/install | bash

CDN="https://medical-protocol-workflows.vercel.app/medical-protocol"
PROJECT="my-clinic"

echo ""
echo "  medical protocol — installer"
echo "  ─────────────────────────────"
echo ""

# --- Node.js ---
if command -v node &>/dev/null; then
  NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VERSION" -ge 18 ]; then
    echo "  [ok] node.js $(node -v)"
  else
    echo "  [!!] node.js $(node -v) is too old (need v18+)"
    echo "       visit https://nodejs.org to update"
    exit 1
  fi
else
  echo "  [..] installing node.js..."
  if command -v curl &>/dev/null; then
    curl -fsSL https://fnm.vercel.app/install | bash
    export PATH="$HOME/.local/share/fnm:$PATH"
    eval "$(fnm env)"
    fnm install --lts
    echo "  [ok] node.js $(node -v)"
  else
    echo "  [!!] curl not found — install node.js manually from https://nodejs.org"
    exit 1
  fi
fi

# --- npm ---
if ! command -v npm &>/dev/null; then
  echo "  [!!] npm not found — reinstall node.js from https://nodejs.org"
  exit 1
fi

# --- Claude Code ---
if command -v claude &>/dev/null; then
  echo "  [ok] claude code"
else
  echo "  [..] installing claude code..."
  npm install -g @anthropic-ai/claude-code
  echo "  [ok] claude code"
fi

# --- Project setup ---
if [ -d "$PROJECT" ]; then
  echo "  [ok] $PROJECT/ already exists"
  cd "$PROJECT"
else
  echo "  [..] creating $PROJECT/..."
  mkdir -p "$PROJECT"
  cd "$PROJECT"
  echo "  [ok] $PROJECT/"
fi

# --- Protocol file ---
mkdir -p .claude
if [ -f .claude/protocol.md ]; then
  echo "  [ok] protocol.md"
else
  echo "  [..] downloading protocol..."
  curl -fsSL "$CDN/protocol.md" -o .claude/protocol.md
  echo "  [ok] protocol.md"
fi

echo ""
echo "  ─────────────────────────────"
echo "  ready. to start:"
echo ""
echo "    cd $PROJECT"
echo "    claude"
echo ""
echo "  then describe what you need:"
echo "    \"I need a vital signs monitor for my clinic\""
echo ""
