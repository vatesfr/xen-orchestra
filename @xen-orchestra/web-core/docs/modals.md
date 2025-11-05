# Modals

## `useModal` hook

You can read the [useModal](../lib/packages/modal/README.md#opening-a-modal-usemodal-composable) documentation to learn more about how to open a modal.

A modal component should not contain any logic. It should only display the content of the modal and emit a `confirm` or `cancel` event.

## Create a modal with `VtsModal` component

### Basic dismissible modal

A dismissible modal can be closed by clicking on the close button or by clicking outside the modal.

```html
<template>
  <VtsModal accent="info" dismissible>
    <template #content> Hello World </template>
  </VtsModal>
</template>
```

#### Custom dismiss event

By default, a `dismissible` modal will call the `onCancel` handler of `useModal`, if any. Else it will just close the modal.

If you want to use a custom event, you can pass the `dismiss` event to the `VtsModal` component.

```html
<VtsModal accent="info" dismissible @dismiss="handleDismiss()"></VtsModal>
```

### Modal with buttons

To confirm or cancel the modal, you can use `VtsModalConfirmButton` and `VtsModalCancelButton`.

For other actions, you can use `VtsModalButton`.

By default, these buttons will be the same color as the modal's accent color.

They also will be disabled with a spinner when the modal is busy.

```html
<template>
  <VtsModal accent="info">
    <template #content> You are about to delete this item. </template>

    <template #buttons>
      <VtsModalCancelButton />
      <VtsModalConfirmButton>Delete</VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>
```

### Custom `confirm` and `cancel` events

If you need to pass arguments to the `confirm` or `cancel` event, you can define and emit them manually.

```html
<template>
  <VtsModal accent="info" @confirm="emit('confirm', name)">
    <template #content>
      What's your name?

      <input v-model="name" />
    </template>

    <template #buttons>
      <VtsModalCancelButton @click="emit('cancel', false)">Cancel</VtsModalCancelButton>
      <VtsModalCancelButton @click="emit('cancel', true)">CANCEL!!!</VtsModalCancelButton>
      <VtsModalConfirmButton>Submit</VtsModalConfirmButton>
    </template>
  </VtsModal>
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

`VtsModal` is a form, and, by default, `VtsModalConfirmButton` will be a "submit" button.

When the form is submitted, it will emit a `confirm` event, if any. Otherwise, it will close the modal.

If you want to have multiple confirm buttons, to pass different payloads to the `confirm` event, you can pass a `@click` event.

In this case, the button will no longer be a "submit" button.

```html
<template>
  <VtsModal accent="info">
    <template #content> How many do you want? </template>

    <template #buttons>
      <VtsModalCancelButton>None</VtsModalCancelButton>
      <VtsModalConfirmButton @click="emit('confirm', 1)">1</VtsModalConfirmButton>
      <VtsModalConfirmButton @click="emit('confirm', 10)">10</VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
  const emit = defineEmits<{
    confirm: [count: number]
  }>()
</script>
```
