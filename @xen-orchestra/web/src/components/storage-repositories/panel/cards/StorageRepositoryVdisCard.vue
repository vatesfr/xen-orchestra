<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('vdis', { n: vdis.length }) }}
      <UiCounter :value="vdis.length" accent="neutral" size="small" variant="primary" />
    </UiCardTitle>
    <UiCollapsibleList v-if="vdis.length > 0" tag="ul" :total-items="vdis.length">
      <li v-for="vdi in vdis" :key="vdi.id" v-tooltip class="text-ellipsis">
        <UiLink size="small" icon="fa:hard-drive" :href="`/#/srs/${vdi.$SR}/disks?s=1_0_asc-${vdi.id}`">
          {{ vdi.name_label }}
        </UiLink>
      </li>
    </UiCollapsibleList>
    <VtsStateHero v-else type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-vdis-attached') }}
    </VtsStateHero>
  </UiCard>
</template>

<script lang="ts" setup>
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { XoVdi } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { vdis } = defineProps<{
  vdis: XoVdi[]
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;
}
</style>
