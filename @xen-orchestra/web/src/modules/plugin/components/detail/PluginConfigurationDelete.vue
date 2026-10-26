<template>
  <div class="plugin-configuration-delete">
    <div class="info">
      <span class="typo-body-bold">{{ t('action:delete-configuration') }}</span>
      <UiInfo accent="info" wrap>{{ t('plugin:delete-configuration-info') }}</UiInfo>
    </div>
    <UiButton
      v-tooltip="!canDelete && errorMessage"
      variant="secondary"
      accent="danger"
      size="medium"
      left-icon="action:delete"
      :disabled="!canDelete"
      :busy="isDeleting"
      @click="emit('delete')"
    >
      {{ t('action:delete') }}
    </UiButton>
  </div>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
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
