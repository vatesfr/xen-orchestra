<template>
  <UiModal
    accent="warning"
    icon="status:warning-picto"
    @confirm="emit('confirm', snapshotBefore)"
    @dismiss="emit('cancel')"
  >
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
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>{{ t('action:revert-to-snapshot') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  confirm: [snapshotBefore: boolean]
  cancel: []
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
