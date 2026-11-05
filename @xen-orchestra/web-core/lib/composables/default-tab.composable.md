# `useDefaultTab` Composable

This composable manages automatic navigation to default tabs and remembers the last visited tab for a given router dispatcher.

## How it works

The composable watches route changes and:

- Automatically redirects to the remembered or default tab when navigating to the base dispatcher route
- Stores the last visited tab when switching between objects of the same type (e.g., VM → VM)
- Resets to default tab when navigating to a different object type or any other page
- Uses the naming convention `{dispatcherRouteName}/{tabName}` for tab route names

## Parameters

| Name                  | Type     | Required | Description                                     |
| --------------------- | -------- | :------: | ----------------------------------------------- |
| `dispatcherRouteName` | `string` |    ✓     | Dispatcher page route name (e.g., '/pool/<id>') |
| `defaultTab`          | `string` |    ✓     | Default tab name (e.g., 'dashboard')            |

## Usage

```typescript
// In the dispatcher page component (e.g., `pages/pool/[id].vue`)
useDefaultTab('/pool/[id]', 'dashboard')

// User navigates to /pool/123
// → Automatic redirect to /pool/123/dashboard (default tab)

// User navigates to /pool/123/system
// → 'system' is stored as the last visited tab

// User navigates to /pool/456 (same object type)
// → Automatic redirect to /pool/456/system (tab remembered)

// User navigates to /vm/789 (different object type)
// → Automatic redirect to /vm/789/dashboard (Tab memory is reset)

// User navigates back to /pool/456
// → Automatic redirect to /pool/456/dashboard (default tab)
```

## Storage

Tab memory is stored in localStorage using two different keys:

- `tab-memory.dispatcher` — the dispatcher route name of the last visited object type
- `tab-memory.last` — the last visited tab name
