<template>
  <UiPanelCard class="user-roles-card">
    <UiPanelCardTitle size="medium" :label="t('roles-applied')" counter="0" />

    <VtsStateHero type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-role-applied') }}
    </VtsStateHero>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
