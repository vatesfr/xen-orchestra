# Overlays (modals & drawers)

## Opening an overlay

Overlays are opened with the `useOverlay` composable. Read the [Overlay System](../lib/packages/overlay/README.md) documentation to learn how to define an overlay, open it, and await the user's decision.

An overlay component should not contain any business logic. It should only display the content of the overlay and emit events (typically `confirm` and `cancel`); the logic lives in the composables that open it.

## Create a modal with the `UiModal` component

### Basic dismissible modal

`UiModal` emits a `dismiss` event when the user clicks outside the modal or presses Escape. When a `dismiss` listener is attached, a close button is also displayed.

```html
<template>
  <UiModal accent="info" @dismiss="emit('cancel')">
    <template #content> Hello World </template>
  </UiModal>
</template>

<script lang="ts" setup>
  const emit = defineEmits<{
    cancel: []
  }>()
</script>
```

A modal without a `dismiss` listener is not dismissible: the close button is hidden, and clicking outside or pressing Escape does nothing.

### Modal with buttons

To confirm or cancel the modal, use `VtsOverlayConfirmButton` and `VtsOverlayCancelButton` in the `buttons` slot.

For other actions, use `VtsOverlayButton`.

These buttons take the modal's accent color, and are automatically disabled while the overlay is handling an event — with a spinner on the button that triggered it.

`UiModal` is a form: `VtsOverlayConfirmButton` is a submit button by default, and submitting the form emits the `confirm` event.

```html
<template>
  <UiModal accent="danger" @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #content> You are about to delete this item. </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>Delete</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
  const emit = defineEmits<{
    confirm: []
    cancel: []
  }>()
</script>
```

### Event payloads

If you need to pass a payload to the `confirm` or `cancel` events, emit it from the corresponding handler:

```html
<template>
  <UiModal accent="info" @confirm="emit('confirm', name)" @dismiss="emit('cancel')">
    <template #content>
      What's your name?

      <input v-model="name" />
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>Submit</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
  const emit = defineEmits<{
    confirm: [name: string]
    cancel: []
  }>()

  const name = ref('')
</script>
```

### Multiple confirm buttons

If you want multiple confirm buttons passing different payloads to the `confirm` event, give each one a `@click` handler.

A `VtsOverlayConfirmButton` with a `@click` handler is no longer a submit button.

```html
<template>
  <UiModal accent="info">
    <template #content> How many do you want? </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">None</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton @click="emit('confirm', 1)">1</VtsOverlayConfirmButton>
      <VtsOverlayConfirmButton @click="emit('confirm', 10)">10</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
  const emit = defineEmits<{
    confirm: [count: number]
    cancel: []
  }>()
</script>
```

## Create a drawer with the `UiDrawer` component

`UiDrawer` works the same way: it is a form emitting `confirm` on submit and `dismiss` on outside click or Escape, with `title`, `content`, and `buttons` slots.

```html
<template>
  <UiDrawer :title="t('settings')" @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #content>
      <!-- Drawer content -->
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>Save</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
  const emit = defineEmits<{
    confirm: []
    cancel: []
  }>()

  const { t } = useI18n()
</script>
```
