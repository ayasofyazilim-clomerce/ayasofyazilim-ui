## Summary

<!-- What changes and why, in two or three sentences. Link the plan or ADR with "Refs #N" or a link. -->

## Linked issue

<!-- "Closes #N" closes the issue on merge wherever it appears, prose included: write it once, here, only if this PR
completes it. Otherwise "Refs #N". -->

## Verification

<!-- What you ran and what it showed: the checks, the real flow in a consuming app, the numbers. A claim without
evidence is "not verified". -->

## Screenshots

<!-- For UI changes: before and after, light and dark. Delete the section otherwise. -->

## Consumers

<!-- Does this change a public export, a prop, a default, a peer range or the CSS a consumer imports? If so, what does an
app have to change, and is it in CHANGELOG.md (or noted for the next release PR)? "None" is a fine answer. -->

## Risk

<!-- What could break, who would notice, how to roll back. "Low: docs only" is a fine answer. -->

## Not verified

<!-- One line each, or "nothing". -->

## Checklist

- [ ] The checks in `AGENTS.md` are green (`pnpm lint`, `type-check`, `test`, `build`)
- [ ] Conventional Commit title with a lower-case subject
- [ ] A test for every fix
- [ ] `pnpm exports` run if a module was added, moved or removed
- [ ] User-facing text comes in as props with English defaults; colours use theme tokens
- [ ] No secrets, customer data or personal data
