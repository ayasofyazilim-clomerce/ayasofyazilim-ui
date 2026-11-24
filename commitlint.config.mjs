// Conventional Commits with a lower-case subject, for commit messages and (in CI, .github/workflows/pr-title.yml) PR
// titles. The scope is the component or area in kebab-case: fix(master-data-grid): …, feat(app-shell): …
// Run it locally without adding a dependency:
//   npx -p @commitlint/cli@21.2.4 -p @commitlint/config-conventional@21.2.4 commitlint --from origin/main
// https://commitlint.js.org
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [2, "always", "lower-case"],
    "scope-case": [1, "always", "kebab-case"],
    "body-max-line-length": [1, "always", 120],
  },
};
