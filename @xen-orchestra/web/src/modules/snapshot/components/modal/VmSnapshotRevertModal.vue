<template>
  <VtsModal accent="warning" icon="status:warning-picto" dismissible @confirm="emit('confirm', snapshotBefore)">
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
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>{{ t('action:revert-to-snapshot') }}</VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
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
