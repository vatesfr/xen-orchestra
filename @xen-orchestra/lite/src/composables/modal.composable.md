# useModal composable

### Usage

#### API

`useModal<T>(options: ModalOptions)`

Type parameter:

- `T`: The type for the modal's payload.

Parameters:

- `options`: An optional object of type `ModalOptions`.

Returns an object with:

- `payload: Ref<T | undefined>`: The payload data of the modal. Mainly used if a single modal is used for multiple
  items (typically with `v-for`)
- `isOpen: Ref<boolean>`: A ref indicating if the modal is open or not.
- `open(currentPayload?: T)`: A function to open the modal and optionally set its payload.
- `close()`: A function to close the modal.

#### Types

`ModalOptions`

An object type that accepts:

- `onBeforeClose?: () => boolean`: An optional callback that is called before the modal is closed. If this function
  returns `false`, the modal will not be closed.
- `onClose?: () => void`: An optional callback that is called after the modal is closed.

### Example

```vue
<template>
  <div v-for="item in items">
    {{ item.name }}
    <button @click="openRemoveModal(item)">Delete</button>
  </div>

  <UiModal v-model="isRemoveModalOpen">
    <ModalContainer>
      <template #header>
        Are you sure you want to delete {{ removeModalPayload.name }}?
      </template>
      <template #footer>
        <button @click="handleRemove">Yes</button>
        <button @click="closeRemoveModal">No</button>
      </template>
    </ModalContainer>
  </UiModal>
</template>

<script lang="ts" setup>
import useModal from "@/composables/modal.composable";

const {
  payload: removeModalPayload,
  isOpen: isRemoveModalOpen,
  open: openRemoveModal,
  close: closeRemoveModal,
} = useModal({
  onBeforeClose: () =>
    window.confirm("Are you sure you want to close this modal?"),
  onClose: () => console.log("Modal closed"),
});

async function handleRemove() {
  await removeItem(removeModalPayload.id);
  closeRemoveModal();
}
</script>
```
