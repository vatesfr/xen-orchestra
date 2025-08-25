<template>
  <div v-if="modalStore.modals.length > 0" class="vts-modals-list">
    <ModalProvider v-for="modal of modalStore.modals" :key="modal.id" :modal>
      <component
        :is="modal.component"
        class="modal-component"
        v-bind="modal.props"
        @confirm="modal.onConfirm"
        @cancel="modal.onCancel"
      />
    </ModalProvider>
  </div>
</template>

<script lang="ts" setup>
import { useModalStore } from '@core/packages/modal/modal.store.ts'
import ModalProvider from '@core/packages/modal/ModalProvider.vue'

const modalStore = useModalStore()
</script>

<style lang="postcss" scoped>
.vts-modals-list {
  position: fixed;
  inset: 0;
  background-color: var(--color-opacity-primary);
  z-index: 1010;

  .modal-component:not(:last-child) {
    filter: brightness(0.8);
  }
}
</style>
