<template>
  <div class="buttons-container">
    <UiLink :to="cancelTo" size="medium">
      {{ t('cancel') }}
    </UiLink>
    <UiButton type="submit" size="medium" accent="brand" variant="primary">
      {{ submitLabel }}
    </UiButton>
  </div>
</template>

<script lang="ts" setup>
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

<style lang="postcss" scoped>
.buttons-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2.4rem;
  margin-block-start: 2.4rem;
}
</style>
