# useModal composable

```vue
<template>
  <div v-for="item in items">
    {{ item.name }} <button @click="openRemoveModal(item)">Delete</button>
  </div>

  <UiModal v-if="isRemoveModalOpen">
    Are you sure you want to delete {{ removeModalPayload.name }}

    <button @click="handleRemove">Yes</button>
    <button @click="closeRemoveModal">No</button>
  </UiModal>
</template>

<script lang="ts" setup>
import useModal from "@/composables/modal.composable";

const {
  payload: removeModalPayload,
  isOpen: isRemoveModalOpen,
  open: openRemoveModal,
  close: closeRemoveModal,
} = useModal();

async function handleRemove() {
  await removeItem(removeModalPayload.id);
  closeRemoveModal();
}
</script>
```
