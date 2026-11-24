@AGENTS.md

## Claude Code specifics

- The org's `core` plugin is the method: `/core:start` for new work, `/core:verify` before a PR, `/core:cleanup` at the
  end. Its agents (`researcher`, `architect`, `implementer`, `verifier`, `test-engineer`) take focused steps.
- Personal preferences go in `CLAUDE.local.md` (gitignored) or user settings, never in this file.
