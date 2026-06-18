<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('vdis') }}
      <UiCounter :value="vdis.length" accent="neutral" size="small" variant="primary" />
    </UiCardTitle>
    <UiCollapsibleList v-if="vdis.length > 0" tag="ul" :total-items="vdis.length">
      <li v-for="vdi in vdis" :key="vdi.uuid" v-tooltip class="text-ellipsis">
        {{ vdi.name_label }}
      </li>
    </UiCollapsibleList>
    <VtsStateHero v-else type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-vdi-attached') }}
    </VtsStateHero>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XenApiVdi } from '@/libs/xen-api/xen-api.types.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  vdis: XenApiVdi[]
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;
}
</style>
