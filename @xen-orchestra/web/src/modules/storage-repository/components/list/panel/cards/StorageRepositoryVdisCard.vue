<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('vdis') }}
      <UiCounter :value="vdis.length" accent="neutral" size="small" variant="primary" />
    </UiCardTitle>
    <UiCollapsibleList v-if="vdis.length > 0" tag="ul" :total-items="vdis.length">
      <li v-for="vdi in vdis" :key="vdi.id" v-tooltip class="text-ellipsis">
        <UiLink size="small" icon="object:vdi" :href="buildXo5Route(`/srs/${vdi.$SR}/disks?s=1_0_asc-${vdi.id}`)">
          {{ vdi.name_label }}
        </UiLink>
      </li>
    </UiCollapsibleList>
    <VtsStateHero v-else type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-vdi-attached') }}
    </VtsStateHero>
  </UiCard>
</template>

<script lang="ts" setup>
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  vdis: FrontXoVdi[]
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;
}
</style>
