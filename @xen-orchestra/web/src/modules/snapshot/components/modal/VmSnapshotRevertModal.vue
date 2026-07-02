<template>
  <VtsOverlay type="modal" accent="warning" icon="status:warning-picto" @confirm="emit('confirm', snapshotBefore)">
    <template #title>
      {{ t('confirm-vm-revert') }}
    </template>

    <template #content>
      <div class="content">
        <p>{{ t('snapshot-revert-warning') }}</p>
        <UiCheckbox v-model="snapshotBefore" accent="brand">
          {{ t('snapshot-revert-snapshot-before') }}
        </UiCheckbox>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton>{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>{{ t('action:revert-to-snapshot') }}</VtsOverlayConfirmButton>
    </template>
  </VtsOverlay>
</template>

<script lang="ts" setup>
import VtsOverlay from '@core/components/overlay/VtsOverlay.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  confirm: [snapshotBefore: boolean]
}>()

const { t } = useI18n()

const snapshotBefore = ref(true)
</script>

<style lang="postcss" scoped>
.content {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  align-items: center;
}
</style>
