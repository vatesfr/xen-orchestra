<template>
  <UiCard class="vts-quick-info-card">
    <UiCardTitle>{{ t('quick-info') }}</UiCardTitle>
    <VtsStateHero v-if="loading" format="card" type="busy" size="medium" />
    <div v-else class="content">
      <div class="info-container">
        <slot />
      </div>
      <div v-if="slots.footer" class="footer">
        <slot name="footer" />
      </div>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  loading: boolean
}>()

const slots = defineSlots<{
  default(): any
  footer?(): any
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.vts-quick-info-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  .info-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(25rem, 1fr));
    gap: 2.4rem;
  }
}
</style>
