<template>
  <UiModal accent="warning" @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>Confirm rename</template>
    <template #content>
      <div class="demo-confirm-modal-content">
        <p>
          Rename "<strong>{{ currentName }}</strong
          >" to "<strong>{{ newName }}</strong
          >"?
        </p>
        <p>Confirming runs a fake 1.5s API call: the Rename button turns busy and the Cancel button is locked.</p>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>Rename</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'

defineProps<{
  currentName: string
  newName: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<style lang="postcss" scoped>
.demo-confirm-modal-content {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
