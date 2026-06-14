#!/usr/bin/env node
/**
 * Claude Code PreToolUse guard: reject `git commit` attempts whose message is
 * not a Conventional Commit, so the agent's commits stay compatible with
 * commitlint + release-please. This is a fast, dependency-free first line of
 * defense; husky's commit-msg hook and CI run the full commitlint for everyone.
 *
 * Exit 0 = allow, exit 2 = block (stderr is shown back to Claude). When the
 * message can't be confidently extracted, we allow and let husky catch it.
 */

const CONVENTIONAL =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]+\))?!?: .+/
// Auto-generated subjects we should never block.
const ALLOWED = [/^Merge /, /^Revert /, /^chore\(\w+\): release /]
const HEREDOC = /<<-?\s*'?([A-Za-z_][\w]*)'?\s*\n([\s\S]*?)\n\1\b/
const MESSAGE_FLAG = /(?:-m|--message(?:=|\s+))\s*("([^"]*)"|'([^']*)')/
const IS_COMMIT = /\bgit\b[^\n]*\bcommit\b/

function readStdin() {
  return new Promise((resolve) => {
    let data = ''
    process.stdin.on('data', (c) => {
      data += c
    })
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', () => resolve(''))
  })
}

function extractMessage(command) {
  // Heredoc: git commit ... -F - <<'EOF' ... EOF  (or -F-/--file=-)
  const heredoc = command.match(HEREDOC)
  if (heredoc) return heredoc[2]

  // One or more -m / --message flags (subject is the first one).
  const flag = command.match(MESSAGE_FLAG)
  if (flag) return flag[2] ?? flag[3] ?? ''

  return null
}

const raw = await readStdin()
let input
try {
  input = JSON.parse(raw)
} catch {
  process.exit(0)
}

const command = input?.tool_input?.command
if (input?.tool_name !== 'Bash' || typeof command !== 'string') process.exit(0)
if (!IS_COMMIT.test(command)) process.exit(0)

const message = extractMessage(command)
if (!message) process.exit(0) // editor/file commit — let husky handle it.

const subject = message.trim().split('\n')[0].trim()
if (ALLOWED.some((re) => re.test(subject)) || CONVENTIONAL.test(subject)) {
  process.exit(0)
}

process.stderr.write(
  `Commit message is not a Conventional Commit:\n  "${subject}"\n\nUse "<type>[optional scope]: <description>", e.g. "feat: add CSV import".\nAllowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.\n`
)
process.exit(2)
