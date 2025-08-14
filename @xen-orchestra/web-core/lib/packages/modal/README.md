# Modal System

### Modals list component

First, create a component which will display the modals.

If needed, you can use the `ModalProvider` component to provide the `modal` to children components.

For example:

```vue
<template>
  <div v-if="modalStore.modals.length > 0" class="modals">
    <ModalProvider v-for="modal of modalStore.modals" :key="modal.id" :modal>
      <component :is="modal.component" class="modal" v-bind="modal.bindings" />
    </ModalProvider>
  </div>
</template>

<script lang="ts" setup>
const modalStore = useModalStore()
</script>

<style lang="postcss" scoped>
.modals {
  position: fixed;
  inset: 0;
  background-color: var(--color-opacity-primary);
  z-index: 1010;

  .modal:not(:last-child) {
    filter: brightness(0.8);
  }
}
</style>
```

### Modal component

You then need to create a Modal component which will emit `confirm` and `cancel` events, as needed.

```vue
<template>
  <div class="modal-container">
    <div class="modal">
      <h1>My modal</h1>
      <button @click="emit('confirm')">Confirm</button>
      <button @click="emit('cancel')">Cancel</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<style lang="postcss" scoped>
.modal-container {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
```

### Opening a modal (`useModal` composable)

You can create a function to open a modal with `useModal`

```ts
const openModal = useModal(config)
```

| Property              | Type                                  | Required |   Default   | Description                                                                                                                                  |
| --------------------- | ------------------------------------- | :------: | :---------: | -------------------------------------------------------------------------------------------------------------------------------------------- |
| component             | `Promise<Component>`                  |    ✓     |             | The promise of the modal component to open. (e.g: `component: import('path/to/modal.vue')`                                                   |
| props                 | `Record<string, MaybeRef<any>>`       |          |    `{}`     | The props to pass to the modal component                                                                                                     |
| onConfirm             | `(...args: any[]) => TConfirmPayload` |          | `undefined` | An optional callback to call when the modal is confirmed. It will take the args of the `confirm` event of the modal's `defineEmits`, if any. |
| onCancel              | `(...args: any[]) => TCancelPayload`  |          | `undefined` | An optional callback to call when the modal is cancelled. It will take the args of the `cancel` event of the modal's `defineEmits`, if any.  |
| keepOpenOnRouteChange | `boolean`                             |          |   `false`   | By default, the modal will close when the use navigates away from the page. If `true`, the modal will stay open until it is closed manually. |
| keepOpenOnAbort       | `boolean`                             |          |   `false`   | If the modal handler is aborted (i.e. opening a confirmation modal from the current modal and user cancels it), the modal will stay open.    |

The result of `openModal()` will be `Promise<ModalConfirmResponse<TConfirmPayload> | ModalCancelResponse<TCancelPayload>>`

If `onConfirm` / `onCancel` returns a `Promise`, then the modal will not close until the promise is resolved, and its `busy` state will be set to `true`.

`onConfirm` returns a `ModalConfirmResponse<TConfirmPayload>`

`onCancel` returns `ModalCancelResponse<TCancelPayload>`

```ts
const openMyModal = useModal({
  component: import('path/to/MyModal.vue'),
  props: {
    foo: 'Foo',
    bar: computed(() => someBar),
  },
  onConfirm: () => console.log('Confirmed!'),
  onCancel: () => console.log('Cancelled!'),
})
```

```html
<button @click="openModal()">Open modal</button>
```

## Opening a modal with arguments

You can pass a function returning a config instead of a config object.

```ts
const openMyModal = useModal((name: string) => ({
  immediate: true,
  component: import('path/to/MyModal.vue'),
  props: { name },
  onConfirm: () => console.log('Confirmed for', name),
  onCancel: () => console.log('Cancelled for', name),
})
```

```html
<button @click="openModal('John')">Open John modal</button> <button @click="openModal('Jane')">Open Jane modal</button>
```

## `onConfirm` and `onCancel` event args

If your Modal component defines args for `confirm` and `cancel` events, you'll get them as arguments of the `onConfirm` and `onCancel` callbacks.

```vue
<template>
  <div class="modal-container">
    <div class="modal">
      <h1>My modal</h1>
      <button @click="emit('confirm', 1)">Select 1</button>
      <button @click="emit('confirm', 10)">Select 10</button>
      <button @click="emit('cancel')">Cancel</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineEmits<{
  confirm: [count: number]
  cancel: []
}>()

const openModal = useModal({
  component: import('path/to/MyModal.vue'),
  onConfirm: (count: number) => console.log('Confirmed with count', count),
})
</script>
```

## Chaining modals

You can open a modal from another modal.

For example, you can open a confirmation modal from a delete modal.

Since `useModal` muse be called at the root of your component, you can't use it inside a handler.

In that case, you can call `useModal()` with no arguments. It will return a function to open the modal later.

```ts
const openModal = useModal()

const openDeleteModal = useModal({
  component: import('path/to/DeleteModal.vue'),
  onConfirm: async () => {
    const { confirmed } = await openModal('confirm-delete', {
      component: import('path/to/ConfirmModal.vue'),
      props: { message: 'Are you sure?' },
    })

    if (confirmed) {
      await deleteResource()
    }
  },
})
```

## Aborting the closing of a modal

In the previous example, whether the user confirmed or canceled the second modal, the `onConfirm` handler would succeed and then the modal would close.

If you want to prevent this, you can return the `ABORT_MODAL` symbol.

```ts
const openModal = useModal()

const openDeleteModal = useModal({
  component: import('path/to/DeleteModal.vue'),
  onConfirm: async () => {
    const { confirmed } = await openModal({
      component: import('path/to/ConfirmModal.vue'),
      props: { message: 'Are you sure?' },
    })

    if (confirmed) {
      await deleteResource()
    } else {
      return ABORT_MODAL // This will keep the first modal open
    }
  },
})
```

Another way is to use the `keepOpenOnAbort` option and to return directly the `openModal` response:

```ts
const openModal = useModal()

const openDeleteModal = useModal({
  component: import('path/to/DeleteModal.vue'),
  keepOpenOnAbort: true,
  onConfirm: async () => {
    const response = await openModal({
      component: import('path/to/ConfirmModal.vue'),
      props: { message: 'Are you sure?' },
    })

    if (confirmed) {
      await deleteResource()
    }

    return response
  },
})
```
