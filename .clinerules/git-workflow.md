# Git Workflow

Git conventions and version management for this project.

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Test updates
- `chore:` - Build/dependency updates

### Examples
```bash
feat: add currency conversion endpoint
fix: correct balance calculation in transactions
docs: update API documentation for accounts
test: add integration tests for payees
```

## Pre-commit Hooks

Husky runs automatically before each commit:
```bash
pnpm run lint    # Check code style
pnpm t           # Run tests
```

If either check fails, the commit will be blocked. Fix the issues before committing.

## Changesets Workflow

For version management and releases:

```bash
# 1. After making changes, create a changeset
pnpm changeset

# 2. Select which packages changed (automatically detected)
# 3. Select version bump type (patch/minor/major)
# 4. Describe the changes

# 5. Update versions (usually automated in CI)
pnpm changeset version

# 6. Build and publish (usually automated in CI)
pnpm release
```

## Changeset Types

- **patch** (0.0.x): Bug fixes, minor updates
- **minor** (0.x.0): New features, backwards compatible
- **major** (x.0.0): Breaking changes

## CI/CD Workflows

### node.yml (runs on every push)
- Linting checks
- Tests on Node 18.x, 20.x, 22.x
- Browser tests (Chromium, Firefox, WebKit)
- Trivy security scanning

### pnpm-release.yml (runs on main branch)
- Changesets version management
- Package publishing to GitHub Packages

### docs-deploy.yml
- Deploys documentation to GitHub Pages

## Branch Protection

- Main branch requires passing checks
- Pull requests require review
- All CI checks must pass

## Reference

See `CONTRIBUTING.md` for detailed contribution guidelines.
See `.changeset/config.json` for changeset configuration.