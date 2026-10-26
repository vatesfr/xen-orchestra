<template>
  <div class="plugin-configuration-delete">
    <div class="info">
      <span class="typo-body-bold">{{ t('action:delete-configuration') }}</span>
      <UiInfo accent="info" wrap>{{ t('plugin:delete-configuration-info') }}</UiInfo>
    </div>
    <VtsDeleteButton
      :tooltip="!canDelete && errorMessage"
      :disabled="!canDelete"
      :busy="isDeleting"
      @click="emit('delete')"
    />
  </div>
</template>

<script lang="ts" setup>
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  canDelete: boolean
  isDeleting: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  delete: []
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.plugin-configuration-delete {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.6rem;
  padding-block-start: 2.4rem;
  border-block-start: 0.1rem solid var(--color-neutral-border);

  .info {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
