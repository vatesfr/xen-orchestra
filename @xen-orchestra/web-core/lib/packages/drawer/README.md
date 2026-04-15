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

| Property              | Type                                  | Required | Default     | Description                                |
| --------------------- | ------------------------------------- | :------: | ----------- | ------------------------------------------ |
| component             | `Promise<Component>`                  |    ✓     |             | `import('path/to/drawer.vue')`             |
| props                 | `Record<string, MaybeRef<any>>`       |          | `{}`        | Props passed to the drawer component       |
| onConfirm             | `(...args: any[]) => TConfirmPayload` |          | `undefined` | Called when the drawer is confirmed        |
| onCancel              | `(...args: any[]) => TCancelPayload`  |          | `undefined` | Called when the drawer is cancelled        |
| keepOpenOnRouteChange | `boolean`                             |          | `false`     | By default the drawer closes on navigation |

### Drawer component

A drawer component uses `VtsDrawer` and its sub-components:

```vue
<!-- MyDrawer.vue -->
<template>
  <VtsDrawer :dismissible :current>
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
  current?: boolean
}>()
</script>
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

```ts
const openMyDrawer = useDrawer({
  component: import('path/to/MyDrawer.vue'),
  onConfirm: () => 'saved',
  onCancel: () => 'aborted',
})

const result = await openMyDrawer()

if (result.confirmed) {
  result.payload // 'saved'
} else {
  result.payload // 'aborted'
}
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

> **Note:** Returning `ABORT_DRAWER` from `onConfirm` does **not** keep the drawer open. The drawer is closed optimistically before `onConfirm` runs, so returning `ABORT_DRAWER` only prevents the promise from resolving.
