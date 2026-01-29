<template>
  <div v-if="modalStore.modals.length > 0" class="vts-modal-list">
    <ModalProvider v-for="(modal, index) of modalStore.modals" :key="modal.id" :modal>
      <component
        :is="modal.component"
        class="modal-component"
        v-bind="modal.props"
        :current="index === modalStore.modals.length - 1"
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
.vts-modal-list {
  position: fixed;
  inset: 0;
  background-color: var(--color-opacity-primary);
  z-index: 1011;

  .modal-component:not(:last-child) {
    filter: brightness(0.8);
  }
}
</style>
