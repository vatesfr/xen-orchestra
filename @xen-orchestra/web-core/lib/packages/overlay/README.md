# Overlay

Promise-based overlays (modals, drawers…) for Vue.

You define an overlay from any component, open it, and `await` the user's decision.

`useOverlay` takes a component-loader and the list of its events you want to handle. Events are identified by their handler prop name (`onYes` for a `yes` emit), and the keys are type-checked against the component's actual emits. In the following example, the overlay will automatically close when `ConfirmModal` emits `yes` or `no`:

```ts
const { open } = useOverlay({
  component: () => import('path/to/ConfirmModal.vue'),
  events: {
    onYes: true,
    onNo: true,
  },
})

async function showConfirmation() {
  const { event } = await open()

  // At this point, the user has made a decision and the overlay is closed

  if (event === 'onYes') {
    // The user confirmed
  }
}
```

The promise resolves with `{ event, payload }` (see below) when the user makes a decision, and the overlay closes automatically.

`true` is a shorthand for "when this event is emitted, close the overlay". The response payload is then `undefined`.

## Passing props

If the component has props, pass them to `open()`. They are fully type-checked, and `open()` won't compile without them if any prop is required:

```ts
const { open } = useOverlay({
  component: () => import('path/to/VmConfirmModal.vue'),
  events: {
    onConfirm: true,
    onCancel: true,
  },
})

async function showConfirmation() {
  const { event } = await open({
    props: {
      message: 'Are you sure you want to do this?',
    },
  })
}
```

Props are passed as-is and captured when the overlay opens. To keep an overlay in sync with live data, pass a `reactive()` object containing computeds — or better, use `reactiveComputed` from VueUse:

```ts
const props = reactiveComputed(() => ({
  message: `${selectedItems.value.length} items will be deleted`,
}))

async function showDeleteConfirmation() {
  const { event } = await open({ props })
}
```

## Custom handlers and payloads

Instead of `true`, an event can have a handler. It receives the event's emit arguments, and whatever it returns (awaited) becomes the response payload:

```ts
const { open: openRenameModal } = useOverlay({
  component: () => import('path/to/RenameModal.vue'),
  events: {
    onSubmit: (newName: string) => newName.trim(),
    onCancel: true,
  },
})

async function renameItem() {
  const response = await openRenameModal()

  if (response.event === 'onSubmit') {
    response.payload // ← string (trimmed newName)
  }
}
```

The response is a discriminated union: narrowing on `response.event` narrows the type of `response.payload` accordingly.

Handlers can be async. The overlay stays open (and is marked as busy, see below) while the handler runs, then closes when it resolves:

```ts
events: {
  onSubmit: async (newName: string) => {
    await api.rename(newName)
  },
  onCancel: true,
}
```

While a handler is running, any further event is ignored: a double-click, or a click on Cancel during a save, does nothing.

## Keeping the overlay open with `KEEP_OVERLAY_OPEN`

Sometimes handling an event should _not_ close the overlay — a validation failure, a failed API call. Return `KEEP_OVERLAY_OPEN` for that:

```ts
const { open } = useOverlay({
  component: () => import('path/to/RenameModal.vue'),
  events: {
    onSubmit: async (newName: string) => {
      try {
        await api.rename(newName)
      } catch {
        notify('Failed to rename')

        return KEEP_OVERLAY_OPEN
      }
    },
    onCancel: true,
  },
})
```

The overlay stays open, the promise stays pending, and the user can try again. `KEEP_OVERLAY_OPEN` is automatically excluded from the payload type.

## Per-call handlers

`open()` also accepts `events`. A per-call handler for an event that already has a `useOverlay` handler runs _after_ it: the per-call handler receives the payload the `useOverlay` handler produced, and returns the final payload (or `KEEP_OVERLAY_OPEN`):

```ts
const { open } = useOverlay({
  component: () => import('path/to/RenameModal.vue'),
  events: {
    onSubmit: (newName: string) => newName.trim(),
    onCancel: true,
  },
})

async function renameItem(id: string) {
  await open({
    events: {
      onSubmit: async newName => {
        const success = await api.rename(id, newName)

        if (!success) {
          notify('Failed to rename')

          return KEEP_OVERLAY_OPEN
        }

        return newName
      },
    },
  })
}
```

This is what makes composition work: the composable defining the overlay handles the generic part (extracting and cleaning the value), while each call site decides what to do with it.

An event that is _not_ declared in `useOverlay` can also be handled at open time. Its handler then receives the raw emit arguments directly, and the event is added to the response union for that call.

## Aborted overlays

An overlay can be torn down without a user decision:

- the component that created it (where `useOverlay` was called) is unmounted (its scope is disposed),
- or `open()` is called again on the same `useOverlay` instance while the overlay is still open (the previous one is replaced).

In both cases the promise resolves with `OVERLAY_ABORT_EVENT` (a symbol) as its `event`, and no handler runs:

```ts
const response = await open()

if (response.event === OVERLAY_ABORT_EVENT) {
  return
}
```

The `OVERLAY_ABORT_EVENT` case is always part of the response union, so exhaustive `event` checks will remind you it exists.

## Busy and disabled triggers

Inside the overlay component, use `useOverlayTrigger()` to wire the controls that emit events (buttons, typically) to the overlay's state:

```html
<template>
  <SomeModal @confirm="emit('submit')">
    <div class="content">
      <slot />
    </div>
    <div class="buttons">
      <button type="submit" :disabled="isDisabled" @click="trigger">
        <span v-if="isBusy">Saving...</span>
        <span v-else>Save</span>
      </button>
    </div>
  </SomeModal>
</template>

<script lang="ts" setup>
  const emit = defineEmits<{
    submit: []
  }>()

  const { isBusy, isDisabled, trigger } = useOverlayTrigger()
</script>
```

- `isDisabled` is `true` while the overlay is handling an event — use it to disable every control.
- `isBusy` is `true` while an async handler is running _and_ this trigger initiated it — use it to show a spinner on the right control only. For that, call `trigger()` when the control is activated, so the trigger identifies itself before the event is handled.

Each `useOverlayTrigger()` call creates a distinct trigger, so two buttons never show a spinner at the same time. It works from any component rendered inside an overlay, at any depth, and is inert when the component is not rendered in an overlay.

## Escape key

`useOverlayEscape(handler)` calls the handler when Escape is pressed, but only while the calling component is the current (topmost) overlay and is not already handling an event. The handler is expected to emit the component's own close event, so that Escape goes through the exact same pipeline as a pointer interaction:

```ts
useOverlayEscape(() => emit('dismiss'))
```

Like `useOverlayTrigger()`, it works from any component rendered inside an overlay, and does nothing when the component is not rendered in an overlay.

## Composition: building your own composable

`useOverlay` is designed to be wrapped in small, domain-specific composables:

```ts
// use-user-delete-modal.ts
export function useUserDeleteModal() {
  return useOverlay({
    component: () => import('path/to/UserDeleteModal.vue'),
    events: {
      onConfirm: true,
      onCancel: true,
    },
  })
}

// use-user-delete.ts
export function useUserDelete() {
  const { open } = useUserDeleteModal()

  async function deleteUser(user: User) {
    await open({
      events: {
        onConfirm: () => api.deleteUser(user.id),
      },
      props: { name: user.name },
    })
  }

  return { deleteUser }
}
```

Call sites stay trivial:

```html
<template>
  <button @click="deleteUser(user)">Delete</button>
</template>

<script lang="ts" setup>
  const { deleteUser } = useUserDelete()
</script>
```

## Rendering the overlays

Opened overlays live in a Pinia store (`useOverlayStore`). The app must render them once, near the root, with `OverlayComponent`:

```html
<template>
  <OverlayComponent v-for="overlay of overlayStore.overlays" :key="overlay.key" :overlay />
</template>

<script lang="ts" setup>
  const overlayStore = useOverlayStore()
</script>
```

Styling and animations are up to you. The store also exposes `isCurrent(key)` to style stacked overlays (e.g. dim the ones below the topmost), and each `overlay` carries its current `status`.
