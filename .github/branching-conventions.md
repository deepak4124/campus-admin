# Branching Conventions

## Default branches
- main: production-ready and tagged releases
- dev: integration branch for ongoing development

## Branch naming
Use lowercase and hyphens. Include a short scope.

- feature/<scope>-<short-description>
- fix/<scope>-<short-description>
- chore/<scope>-<short-description>
- refactor/<scope>-<short-description>
- hotfix/<scope>-<short-description>
- release/<version>

Examples:
- feature/admissions-form
- fix/api-auth-timeout
- chore/ci-linting

## Workflow
- Create branches from dev for feature, fix, chore, and refactor work.
- Create hotfix branches from main and merge back to main and dev.
- Only release branches should be merged to main.

## Merge rules
- Use pull requests for all merges.
- Squash merge for feature, fix, chore, and refactor branches.
- Rebase dev frequently to reduce conflicts.

## Versioning
- Use semantic versioning for release branches: release/1.0.0
