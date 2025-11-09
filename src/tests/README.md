# Test Organization

All tests are organized by type and module to make them easy to find and maintain.

## Directory Structure

```
src/tests/
├── unit/                    # Unit tests for individual functions/modules
│   ├── lib/
│   │   ├── auth/           # Auth module unit tests
│   │   │   └── tokenDecode.test.ts
│   │   └── permissions/    # Permissions module unit tests
│   │       ├── roles.test.ts
│   │       ├── roleExtraction.test.ts
│   │       └── extraction.test.ts
│   └── config/             # Configuration unit tests
│       ├── roleMapping.test.ts
│       └── roleMapping.integration.test.ts
│
├── components/              # Component tests (React components)
│   ├── login.test.tsx
│   ├── logout.test.tsx
│   └── nav.test.tsx
│
├── integration/            # Integration tests (feature flows)
│   ├── auth.test.ts
│   ├── federatedLogout.test.ts
│   └── privateRoute.test.ts
│
└── utils/                  # Test utilities and helpers
    └── testHelpers.tsx     # TestWrapper and other test utilities
```

## Test Categories

### Unit Tests (`unit/`)

These test individual functions, utilities, and modules in isolation. They're organized to mirror the source code structure.

- **Location**: `src/tests/unit/`
- **Structure**: Mirrors `src/lib/` and `src/config/` structure
- **Examples**:
  - `unit/lib/permissions/roles.test.ts` - Tests role utility functions
  - `unit/lib/auth/tokenDecode.test.ts` - Tests token decoding functions
  - `unit/config/roleMapping.test.ts` - Tests role mapping configuration

### Component Tests (`components/`)

These test React components in isolation with mocked dependencies.

- **Location**: `src/tests/components/`
- **Naming**: `{ComponentName}.test.tsx`
- **Setup**: Use `TestWrapper` from `utils/testHelpers.tsx` to provide all necessary context providers
- **Examples**:
  - `components/login.test.tsx` - Tests Login component
  - `components/nav.test.tsx` - Tests Nav component

### Integration Tests (`integration/`)

These test complete feature flows and interactions between multiple modules.

- **Location**: `src/tests/integration/`
- **Examples**:
  - `integration/auth.test.ts` - Tests authentication flow
  - `integration/federatedLogout.test.ts` - Tests federated logout flow
  - `integration/privateRoute.test.ts` - Tests route protection

## Test Utilities

### `utils/testHelpers.tsx`

Provides reusable test utilities:

- **`TestWrapper`**: Wraps components with all necessary providers (SessionProvider, TokenProvider, PermissionProvider)

**Usage**:
```typescript
import { TestWrapper } from "../utils/testHelpers";
import { render } from "@testing-library/react";
import MyComponent from "@/components/MyComponent";

render(
  <TestWrapper>
    <MyComponent />
  </TestWrapper>
);
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- nav.test.tsx

# Run tests by category
npm test -- unit/
npm test -- components/
npm test -- integration/

# Run with coverage
npm test -- --coverage
```

## Best Practices

1. **Test Organization**: Keep tests close to the code they test (mirror directory structure)
2. **Test Naming**: Use descriptive test names that explain what is being tested
3. **Test Isolation**: Each test should be independent and not rely on other tests
4. **Mocking**: Mock external dependencies (APIs, contexts) appropriately
5. **Coverage**: Aim for high coverage of business logic, not just line count
6. **Test Helpers**: Use `TestWrapper` for component tests that need providers
7. **Type Safety**: Use TypeScript for all test files

## Adding New Tests

1. **Unit Test**: Add to `unit/{module-path}/{function}.test.ts`
2. **Component Test**: Add to `components/{ComponentName}.test.tsx`
3. **Integration Test**: Add to `integration/{feature}.test.ts`

Follow the existing patterns and use `TestWrapper` for component tests that require context providers.
