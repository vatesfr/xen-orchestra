<template>
  <UiCard class="card-container">
    <UiCardTitle>
      <div class="title">
        {{ t('connected-srs') }}
        <UiCounter :value="srs.length" accent="neutral" size="small" variant="primary" />
      </div>
    </UiCardTitle>
    <UiCollapsibleList v-if="srs.length > 0" tag="ul" :total-items="srs.length">
      <li v-for="sr in srs" :key="sr.id" v-tooltip class="text-ellipsis">
        <UiLink
          size="small"
          :icon="srIconById.get(sr.id)"
          :to="{
            name: '/sr/[id]/general',
            params: { id: sr.id },
            query: { from: SR_PAGE_CONTEXT.HOST, host: host.id },
          }"
        >
          {{ sr.name_label }}
        </UiLink>
      </li>
    </UiCollapsibleList>
    <VtsStateHero v-else type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-sr-attached') }}
    </VtsStateHero>
  </UiCard>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import {
  useXoSrCollection,
  type FrontXoSr,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { SR_PAGE_CONTEXT } from '@/shared/constants.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { objectIcon, type IconName } from '@core/icons'
import { CONNECTION_STATUS } from '@core/types/connection.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const { pbdsByHost } = useXoPbdCollection()
const { getSrById } = useXoSrCollection()

const hostPbds = computed(() => pbdsByHost.value.get(host.id) ?? [])

const srs = computed(() =>
  hostPbds.value.map(pbd => getSrById(pbd.SR)).filter((sr): sr is FrontXoSr => sr !== undefined)
)

const srIconById = computed(() => {
  const iconById = new Map<FrontXoSr['id'], IconName>()

  srs.value.forEach(sr => {
    const pbds = hostPbds.value.filter(pbd => pbd.SR === sr.id)

    if (pbds.length === 0 || pbds.every(pbd => !pbd.attached)) {
      iconById.set(sr.id, objectIcon('sr', CONNECTION_STATUS.DISCONNECTED))
    } else if (pbds.some(pbd => !pbd.attached)) {
      iconById.set(sr.id, objectIcon('sr', CONNECTION_STATUS.PARTIALLY_CONNECTED))
    } else {
      iconById.set(sr.id, objectIcon('sr', CONNECTION_STATUS.CONNECTED))
    }
  })

  return iconById
})
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .title {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
