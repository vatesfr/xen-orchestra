<template>
  <UiPanelCard class="user-roles-card">
    <UiCardTitle>
      <div class="title">
        {{ t('roles-applied') }}
        <UiCounter value="0" accent="neutral" size="small" variant="primary" />
      </div>
    </UiCardTitle>

    <VtsStateHero type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-role-applied') }}
    </VtsStateHero>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.user-roles-card {
  .title {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
