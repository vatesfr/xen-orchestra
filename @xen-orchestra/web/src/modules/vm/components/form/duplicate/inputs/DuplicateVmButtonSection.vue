<template>
  <div class="duplicate-vm-button-section">
    <UiLink :to="cancelTo" size="medium">
      {{ t('cancel') }}
    </UiLink>
    <UiButton variant="primary" accent="brand" size="medium" type="submit">
      {{ submitLabel }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  submitLabel: string
  cancelTo: RouteLocationRaw
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.duplicate-vm-button-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2.4rem;
  margin-block-start: 2.4rem;
}
</style>
