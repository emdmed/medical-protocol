import { describe, it, expect } from 'vitest';
import { claudeCommand } from '../../packages/medprotocol/src/claude-spawn';

describe('claudeCommand', () => {
  const args = ['-p', '--tools', '', '--system-prompt', 'Reply with "JSON" only.', 'C:\\dir\\'];

  it('leaves the call unchanged outside Windows', () => {
    expect(claudeCommand(args, 'linux')).toEqual({ command: 'claude', args, shell: false });
    expect(claudeCommand(args, 'darwin')).toEqual({ command: 'claude', args, shell: false });
  });

  it('builds one quoted shell command on win32', () => {
    expect(claudeCommand(args, 'win32')).toEqual({
      command: 'claude "-p" "--tools" "" "--system-prompt" "Reply with ""JSON"" only." "C:\\dir\\\\"',
      args: [],
      shell: true,
    });
  });

  it('doubles backslashes before an embedded quote on win32', () => {
    expect(claudeCommand(['a\\"b'], 'win32').command).toBe('claude "a\\\\""b"');
  });
});
