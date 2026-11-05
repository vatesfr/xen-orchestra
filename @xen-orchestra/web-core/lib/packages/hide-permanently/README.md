# Hide Permanently

A composable to permanently hide an element (e.g. an informational alert) once the user dismisses it.

Hidden IDs are stored in Local Storage (`permanently-hidden-items` key), so the element stays hidden across page reloads and sessions.

## Registering IDs

Each hideable element is identified by a unique ID, to prevent collisions.

The application must register IDs by augmenting the `PermanentlyHideableItems` interface in a `.d.ts` file:

```ts
declare module '@xen-orchestra/web-core/packages/hide-permanently/types.ts' {
  interface PermanentlyHideableItems {
    'my-first-id': true
    'my-second-id': true
  }
}

export {}
```

## `useHidePermanently`

```ts
const { isVisible: isUserInfoVisible, hidePermanently: hideUserInfoPermanently } = useHidePermanently(id)

// or, with array destructuring:
const [isUserInfoVisible, hideUserInfoPermanently] = useHidePermanently(id)
```

### Arguments

| Argument | Type                    | Required | Description                       |
| -------- | ----------------------- | :------: | --------------------------------- |
| `id`     | `PermanentlyHideableId` |    ✓     | The registered ID of the element. |

### Returns

| Property          | Type                   | Description                                           |
| ----------------- | ---------------------- | ----------------------------------------------------- |
| `isVisible`       | `ComputedRef<boolean>` | Whether the element is visible (i.e. not hidden yet). |
| `hidePermanently` | `() => void`           | Hides the element permanently.                        |

## Example

```vue
<template>
  <div v-if="isHelpTextVisible">
    Some dismissible help text

    <button type="button" @click="hideHelpTextPermanently()">Don't show again</button>
  </div>
</template>

<script lang="ts" setup>
const [isHelpTextVisible, hideHelpTextPermanently] = useHidePermanently('my-first-id')
</script>
```
