# Drawer System

### Drawers list component

Add `VtsDrawerList` once in your app layout. It renders all active drawers from the store.

```vue
<!-- App.vue -->
<template>
  ...
  <VtsDrawerList />
</template>

<script lang="ts" setup>
import VtsDrawerList from '@core/components/drawer/VtsDrawerList.vue'
</script>
```

### Opening a drawer (`useDrawer` composable)

```ts
const openMyDrawer = useDrawer({
  component: import('path/to/MyDrawer.vue'),
  props: {
    foo: 'Foo',
  },
  onConfirm: () => console.log('Confirmed!'),
  onCancel: () => console.log('Cancelled!'),
})
```

```html
<button @click="openMyDrawer()">Open drawer</button>
```

| Property              | Type                                                              | Required | Default     | Description                                |
| --------------------- | ----------------------------------------------------------------- | :------: | ----------- | ------------------------------------------ |
| component             | `Promise<Component>`                                              |    ✓     |             | `import('path/to/drawer.vue')`             |
| props                 | `Record<string, MaybeRef<any>>`                                   |          | `{}`        | Props passed to the drawer component       |
| onConfirm             | `(...args: any[]) => TConfirmPayload \| Promise<TConfirmPayload>` |          | `undefined` | Called when the drawer is confirmed        |
| onCancel              | `(...args: any[]) => TCancelPayload \| Promise<TCancelPayload>`   |          | `undefined` | Called when the drawer is cancelled        |
| keepOpenOnRouteChange | `boolean`                                                         |          | `false`     | By default the drawer closes on navigation |

`useDrawer()` with no arguments returns the raw `openDrawer(id, config)` function for advanced use cases where you manage the drawer ID yourself.

### Drawer component

A drawer component uses `VtsDrawer` and its sub-components:

```vue
<!-- MyDrawer.vue -->
<template>
  <VtsDrawer :dismissible>
    <template #title>My Drawer</template>
    <template #content>
      <!-- your content here -->
    </template>
    <template #buttons>
      <VtsDrawerCancelButton />
      <VtsDrawerConfirmButton>Save</VtsDrawerConfirmButton>
    </template>
  </VtsDrawer>
</template>

<script lang="ts" setup>
import VtsDrawer from '@core/components/drawer/VtsDrawer.vue'
import VtsDrawerCancelButton from '@core/components/drawer/VtsDrawerCancelButton.vue'
import VtsDrawerConfirmButton from '@core/components/drawer/VtsDrawerConfirmButton.vue'

defineProps<{
  dismissible?: boolean
  // Injected by VtsDrawerList: true when this drawer is the topmost in the stack.
  // Pass it through to VtsDrawer so only the current drawer reacts to Escape.
  current?: boolean
}>()
</script>
```

`VtsDrawer` props:

| Prop          | Type      | Default     | Description                                               |
| ------------- | --------- | ----------- | --------------------------------------------------------- |
| `dismissible` | `boolean` | `false`     | Allows closing via backdrop click, X button, and Escape   |
| `isOpen`      | `boolean` | `undefined` | Controls visibility externally (uncontrolled by default)  |
| `current`     | `boolean` | `undefined` | Pass through from parent props — controls Escape handling |

When `isOpen` is omitted, `VtsDrawer` manages its own visibility internally (uncontrolled mode). In controlled mode (`:is-open` provided), the `dismiss` event is emitted instead of closing automatically.

`VtsDrawerCancelButton` and `VtsDrawerConfirmButton` accept an optional `onClick` prop. When provided, the button emits a `click` event instead of triggering `onCancel`/`onConfirm`:

```vue
<VtsDrawerCancelButton :on-click="handleCustomCancel" />
```

### Opening with arguments

```ts
const openMyDrawer = useDrawer((name: string) => ({
  component: import('path/to/MyDrawer.vue'),
  props: { name },
}))

openMyDrawer('John')
```

### Payload and response

Payloads are fully typed based on the return type of `onConfirm` and `onCancel`:

```ts
const openMyDrawer = useDrawer({
  component: import('path/to/MyDrawer.vue'),
  onConfirm: () => 'saved',
  onCancel: () => 'aborted',
})

const result = await openMyDrawer()

if (result.confirmed) {
  result.payload // string
} else {
  result.payload // string
}
```

If `onConfirm` or `onCancel` throws, the promise rejects with the thrown error.

### `onConfirm` and `onCancel` event args

If your drawer component defines args for `confirm` and `cancel` events, you'll get them as arguments of the `onConfirm` and `onCancel` callbacks:

```vue
<!-- MyDrawer.vue -->
<script lang="ts" setup>
defineEmits<{
  confirm: [value: string]
  cancel: []
}>()
</script>
```

```ts
const openMyDrawer = useDrawer({
  component: import('path/to/MyDrawer.vue'),
  onConfirm: (value: string) => console.log('Confirmed with', value),
})
```

### Busy state

If `onConfirm` or `onCancel` returns a `Promise`, the buttons show a busy indicator while the promise is pending.

**Important asymmetry:**

- `onConfirm` closes the drawer **optimistically** before the async work runs. The drawer is gone before `await` settles.
- `onCancel` waits for the async work to complete **before** closing the drawer.

```ts
const openMyDrawer = useDrawer({
  component: import('path/to/MyDrawer.vue'),
  onConfirm: async () => {
    await saveToServer() // drawer is already closed while this runs
  },
  onCancel: async () => {
    await cleanup() // drawer stays open while this runs, then closes
  },
})
```

### Aborting close

Return `ABORT_DRAWER` from `onCancel` to keep the drawer open (e.g. to show a confirmation prompt):

```ts
const openMyDrawer = useDrawer({
  component: import('path/to/MyDrawer.vue'),
  onCancel: async () => {
    if (!hasUnsavedChanges()) {
      return
    }
    const confirmed = await confirmDiscard()
    if (!confirmed) {
      return ABORT_DRAWER // drawer stays open
    }
  },
})
```

> **Note:** Returning `ABORT_DRAWER` from `onConfirm` does **not** keep the drawer open. The drawer is closed optimistically before `onConfirm` runs. Returning `ABORT_DRAWER` permanently prevents the promise from resolving — avoid it in `onConfirm`.
