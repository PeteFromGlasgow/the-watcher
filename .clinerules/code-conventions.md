# Code Conventions

Quick reference for code style and conventions in this project.

## ESLint Rules

- **Indent**: 2 spaces
- **Semicolons**: None (always omitted)
- **Quotes**: Single quotes (with `avoidEscape: true`)
- **Trailing commas**: Never (`commaDangle: 'never'`)
- **Line endings**: LF only

## Naming Conventions

- **Files**: kebab-case (`api-gateway.ts`, `hello-world.test.ts`)
- **Classes**: PascalCase (`AccountService`, `TransactionBuilder`)
- **Functions/Variables**: camelCase (`getUserById`, `accountBalance`)
- **Database columns**: snake_case (`created_at`, `user_id`, `transaction_date`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_REGISTRY`, `API_VERSION`)
- **Package names**: `@in-the-black/<name>` (scoped, kebab-case)

## TypeScript Configuration

- **Strict mode**: Enabled with all strict options
- **Module**: ESNext with NodeNext resolution
- **Target**: ESNext
- **Declaration files**: Generated with source maps

## Module System

**CRITICAL**: All packages use ES modules (`"type": "module"` in package.json)

- Use proper ESM import/export syntax
- Include `.js` extension in imports (TypeScript requirement for ESM)
  ```typescript
  import { buildApp } from '../src/app.js'  // ✓ Correct
  import { buildApp } from '../src/app'    // ✗ Wrong
  ```

## Unused Variables

Prefix with `_` to indicate intentional non-use:
```typescript
function example(_unusedParam: string, usedParam: number) {
  return usedParam * 2
}
```

## File Structure

Every package follows this structure:
```
package-name/
├── src/           # Source code
├── test/          # Test files (*.test.ts)
├── package.json   # Must include "type": "module"
├── tsconfig.json  # TypeScript configuration
└── Dockerfile     # For services that deploy to K8s
```

## Build Output

When built, the structure is:
```
dist/
├── src/    # Compiled source
└── test/   # Compiled tests
```

This is important for import paths in tests and when referencing built artifacts.

## Reference

See `CLAUDE.md` for comprehensive code style documentation.
See `eslint.config.js` for the complete ESLint configuration.