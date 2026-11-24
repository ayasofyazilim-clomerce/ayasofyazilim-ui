# AGENTS.md: @ayasofyazilim-clomerce/ui

Strategy: published library. See the ays core plugin, references/strategies.
Test policy: a test for every fix and every new behaviour; Jest with Testing Library, mostly in `src/test/`.

The org's React 19 / Next.js 16 component library, published to GitHub Packages as `@ayasofyazilim-clomerce/ui`.
The repository is public (MIT). Owners: `@ayasofyazilim-clomerce/frontend-development`.

Rules for every coding agent (Claude Code, Copilot, Codex, Cursor …) and every person. A nested `AGENTS.md` adds rules
for its folder; the nearest file wins.

## Methodology

Every non-trivial task runs **Research → Plan → Implement → Verify → Explain** (`core:start` walks it):

1. Research: check the installed versions and current docs, never memory; notes in `docs/research/`.
2. Plan: `docs/plans/<yyyy-mm-dd>-<topic>.md` for anything beyond a small fix, approved before implementing.
3. Implement: the smallest change that fully solves the task, in a worktree on a branch, committed step by step.
4. Verify: the checks below and the real behaviour; report what was verified and what was not.
5. Explain: visuals and real examples first, then options with a recommendation.

## Where things are

| Path | What |
|---|---|
| `src/components/` | the primitives (shadcn/ui based), one module per file |
| `src/custom/` | the composed components (`schema-form`, `master-data-grid`, `document-viewer`, `app-shell` …) |
| `src/aria/`, `src/hooks/`, `src/lib/` | accessible primitives, hooks and helpers |
| `src/styles/` | `globals.css`, the theme tokens consumers import |
| `src/test/` | most of the Jest tests (a few sit next to their component) |
| `docs/components/` | per-component docs, linked from the README |
| `scripts/exports.mjs` | generates and checks the `exports` and `publishConfig.exports` maps |
| `CHANGELOG.md` | written by hand in the release PR |

## Hard rules

- **Subpath exports.** Every module under `src/{aria,components,custom,hooks,lib}` is its own export
  (`@ayasofyazilim-clomerce/ui/components/button`); there is no barrel. After adding, moving or removing a module, run
  `pnpm exports` and commit the `package.json` change; `pnpm type-check` fails until you do.
- **Text comes in as props.** No hard-coded user-facing strings without a way to replace them: every label, message
  and aria text is an optional prop whose default is English. Apps pass their own translations.
- **Theme tokens, not fixed colours.** Use the tokens from `src/styles/globals.css` (`bg-background`, `text-muted-foreground`,
  `border-input` …) so light and dark both work. No hex, `rgb()` or palette classes like `bg-blue-500` for UI chrome.
- **A test for every fix.** A bug fix lands with a test that fails without it.
- **Dependencies.** Peer dependency ranges are a promise to consumers: widen or narrow them only on purpose, with a
  `CHANGELOG.md` entry. A new runtime dependency needs a reason in the PR. The lockfile is committed.
- **OSS first.** Use what the installed libraries ship; custom code needs approval with the options checked.
- **Secrets.** Never in git, logs, PRs or chat. The library reads no environment variables and needs no token to build.
- **Public repository.** No customer or person names, hosts, IPs or real data in code, tests, docs, commits or PRs.
- **Nothing leaves the machine unasked.** No issue, comment, message or report to anyone outside without a person's
  OK of the exact text.

## Commands

```bash
pnpm install --frozen-lockfile   # once per checkout or worktree
pnpm exports                     # regenerate the exports maps after moving modules
pnpm test:watch                  # tests while you work
```

## Checks

Run before every commit and push (CI runs the first five on every PR and on `main`):

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm type-check   # tsc, plus a check that the exports maps match src
pnpm test
pnpm build        # tsup, declarations, and a check of dist
gitleaks git --redact --no-banner .
```

## Releases

- **Never publish by hand.** The `Publish` workflow publishes when a `ui-v<version>` tag is pushed; always through pnpm,
  which applies `publishConfig.exports`.
- A release is a `chore(release): x.y.z` PR that bumps `version` in `package.json` and adds the `CHANGELOG.md` entry.
  After it is merged, an owner pushes the tag `ui-v<version>` on that commit.
- Breaking changes (a removed export, a changed prop, a narrower peer range) go in the changelog's **Changed** section
  and bump the minor version while the package is 0.x.

## Verification checklist

1. The checks above are green.
2. The real flow works in a consuming app or a test: light and dark, with the default English labels and with labels
   passed in.
3. No secrets, customer data or hard-coded user-facing strings in the diff.
4. Large or risky changes: an independent verifier review on the current head.

## Git and PRs

- Branches `feat/`, `fix/`, `chore/`, `docs/` from `main`; Conventional Commits with a lower-case subject. The scope is
  the component or area in kebab-case: `fix(master-data-grid): …`, `feat(app-shell): …`.
- The PR title is a Conventional Commit too (CI checks it); it becomes the merge commit's subject.
- PRs follow the template; `Closes #N` once, on its own line; `Refs #N` elsewhere. Merge commits and squash merges are
  both allowed.
- Never `--no-verify`, never force-push a shared branch, never merge your own PR without review.
