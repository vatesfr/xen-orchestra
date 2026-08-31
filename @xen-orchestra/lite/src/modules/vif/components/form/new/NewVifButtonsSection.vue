<template>
  <div class="new-vif-buttons-section">
    <UiLink size="medium" accent="brand" variant="secondary" :to="cancelTo">
      {{ t('cancel') }}
    </UiLink>
    <UiButton type="submit" size="medium" accent="brand" variant="primary">
      {{ t('action:create-vif') }}
    </UiButton>
  </div>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useI18n } from 'vue-i18n'
import { type RouteLocationRaw } from 'vue-router'

defineProps<{
  cancelTo: RouteLocationRaw
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.new-vif-buttons-section {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 2.4rem;
  margin-block-start: 2.4rem;
}
</style>
