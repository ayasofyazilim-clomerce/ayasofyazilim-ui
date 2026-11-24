# Contributing to @ayasofyazilim-clomerce/ui

This repository is built by people and coding agents under the same rules; [`AGENTS.md`](AGENTS.md) is the short,
authoritative version. The [README](README.md) covers installing and using the package.

## From issue to merge

1. **Issue.** One outcome with acceptance criteria (the Bug, Feature and Docs forms ask for it).
2. **Research and plan.** For anything beyond a small fix, a plan approved before implementing. Custom code needs
   explicit approval.
3. **Branch and implement.** `feat/…`, `fix/…`, `chore/…` or `docs/…` from `main`, ideally in a git worktree. Commit
   early and often.
4. **Verify.** The checks in `AGENTS.md` (`pnpm lint`, `type-check`, `test`, `build`), then the real flow in a
   consuming app: light and dark, default labels and translated ones.
5. **Pull request.** The template asks for the evidence, the effect on consumers and what was not verified. The title
   is a Conventional Commit; it becomes the merge commit's subject. `Closes #N` once.
6. **Review.** A reviewer who did not write the change; large or risky changes get an independent verifier pass.
7. **Merge.** By an owner, with green CI on the head. Merge commits and squash merges are both fine.

## Roles

- **Owners** (`@ayasofyazilim-clomerce/frontend-development`): decide, review, merge, release.
- **Contributors** (people or agents): take an issue, open a PR, answer the review. They do not merge their own PR.

## Commits

Conventional Commits with a lower-case subject; the scope is the component or area in kebab-case:
`feat(app-shell): add a user-menu slot`, `fix(master-data-grid): keep the select column first`. Breaking changes use
`feat!:` and a `BREAKING CHANGE:` footer. `git config commit.template .gitmessage` puts the format in your editor.

## Releases and the changelog

`CHANGELOG.md` is written by hand, in the release PR, grouped into **Added**, **Changed** and **Fixed** with the PR
numbers. A release goes like this:

1. A `chore(release): x.y.z` PR bumps `version` in `package.json` and adds the `CHANGELOG.md` entry.
2. After it is merged, an owner pushes the tag `ui-v<version>` on the merge commit.
3. The `Publish` workflow checks the tag against `package.json`, runs the checks and publishes to GitHub Packages.

Never publish from a laptop, and never with the npm CLI: pnpm applies `publishConfig.exports`, npm would publish the
`src` entry points.
