# `useDefaultTab` Composable

This composable manages automatic navigation to default tabs and remembers the last visited tab for a given router dispatcher.

## How it works

The composable watches route changes and:

- Automatically redirects to the remembered or default tab when navigating to the base dispatcher route
- Stores the current tab in localStorage for future visits
- Uses the naming convention `{dispatcherRouteName}/{tabName}` for tab route names

## Parameters

| Name                  | Type     | Required | Description                                     |
| --------------------- | -------- | :------: | ----------------------------------------------- |
| `dispatcherRouteName` | `string` |    ✓     | Dispatcher page route name (e.g., '/pool/<id>') |
| `defaultTab`          | `string` |    ✓     | Default tab name (e.g., 'dashboard')            |

## Usage

```typescript
// In the dispatcher page component (e.g., `pages/pool/[id].vue`)
useDefaultTab('pool/[id]', 'dashboard')

// User first navigates to /pool/123
// → Automatic redirect to /pool/123/dashboard (default tab)

// User then navigates to /pool/123/stats
// → 'stats' is stored as the last visited tab for this route

// Finally, user navigates to /pool/456
// → Automatic redirect to /pool/456/stats
```

## Storage

Tab preferences are stored in localStorage under the key `default-tabs` with the structure:

```typescript
Map<string, string> // dispatcherRouteName -> lastVisitedTab
```
