# Overlays

## `useOverlay` hook

You can read the [useOverlay](../lib/packages/overlay/README.md#opening-an-overlay-useoverlay-composable) documentation to learn more about how to open an overlay.

An overlay component (modal, drawer, ...) should not contain any logic. It should only display the content of the overlay and emit a `confirm` or `cancel` event.

## Create an overlay with `VtsOverlay` component

`VtsOverlay` renders either a modal or a drawer, depending on its `type` prop:

- `type="modal"` displays a centered modal (accepts `accent`, `icon` and `dismissible`).
- `type="drawer"` displays a side drawer (accepts `title`).

All the behavior below (dismiss, buttons, `confirm`/`cancel` events) is identical for both types, with one exception: a modal is only dismissible when the `dismissible` prop is set, while a drawer is always dismissible.

```html
<template>
  <VtsOverlay type="drawer" title="Settings">
    <template #content> Hello World </template>
  </VtsOverlay>
</template>
```

### Basic dismissible modal

A dismissible modal can be closed by clicking on the close button, by clicking outside the modal, or by pressing <kbd>Esc</kbd>.

Drawers are always dismissible, so the `dismissible` prop does not exist for them.

```html
<template>
  <VtsOverlay type="modal" accent="info" dismissible>
    <template #content> Hello World </template>
  </VtsOverlay>
</template>
```

#### Custom dismiss event

The dismiss gesture is an implicit cancel: by default, a `dismissible` modal (or a drawer) will trigger the cancel flow of `useOverlay` (its `onCancel` handler runs, and the promise resolves with `status: 'canceled'`).

If you want to use a custom event instead, you can pass the `dismiss` event to the `VtsOverlay` component.

```html
<VtsOverlay type="modal" accent="info" dismissible @dismiss="handleDismiss()"></VtsOverlay>
```

### Modal with buttons

To confirm or cancel the modal, you can use `VtsOverlayConfirmButton` and `VtsOverlayCancelButton`.

For other actions, you can use `VtsOverlayButton`.

By default, these buttons will be the same color as the modal's accent color.

They also will be disabled with a spinner when the modal is busy.

```html
<template>
  <VtsOverlay type="modal" accent="info">
    <template #content> You are about to delete this item. </template>

    <template #buttons>
      <VtsOverlayCancelButton />
      <VtsOverlayConfirmButton>Delete</VtsOverlayConfirmButton>
    </template>
  </VtsOverlay>
</template>
```

### Custom `confirm` and `cancel` events

If you need to pass arguments to the `confirm` or `cancel` event, you can define and emit them manually.

```html
<template>
  <VtsOverlay type="modal" accent="info" @confirm="emit('confirm', name)">
    <template #content>
      What's your name?

      <input v-model="name" />
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel', false)">Cancel</VtsOverlayCancelButton>
      <VtsOverlayCancelButton @click="emit('cancel', true)">CANCEL!!!</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>Submit</VtsOverlayConfirmButton>
    </template>
  </VtsOverlay>
</template>

<script lang="ts" setup>
  const emit = defineEmits<{
    confirm: [name: string]
    cancel: [angry: boolean]
  }>()

  const name = ref('')
</script>
```

### Multiple confirm buttons

`VtsOverlay` is a form, and, by default, `VtsOverlayConfirmButton` will be a "submit" button.

When the form is submitted, it will emit a `confirm` event, if any. Otherwise, it will close the modal.

If you want to have multiple confirm buttons, to pass different payloads to the `confirm` event, you can pass a `@click` event.

In this case, the button will no longer be a "submit" button.

```html
<template>
  <VtsOverlay type="modal" accent="info">
    <template #content> How many do you want? </template>

    <template #buttons>
      <VtsOverlayCancelButton>None</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton @click="emit('confirm', 1)">1</VtsOverlayConfirmButton>
      <VtsOverlayConfirmButton @click="emit('confirm', 10)">10</VtsOverlayConfirmButton>
    </template>
  </VtsOverlay>
</template>

<script lang="ts" setup>
  const emit = defineEmits<{
    confirm: [count: number]
  }>()
</script>
```
