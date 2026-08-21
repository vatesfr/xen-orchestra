<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('connected-sr') }}
      <UiCounter :value="srs.length" accent="neutral" size="small" variant="primary" />
    </UiCardTitle>
    <UiCollapsibleList v-if="srs.length > 0" tag="ul" :total-items="srs.length">
      <li v-for="sr in srs" :key="sr.id" v-tooltip class="text-ellipsis">
        <UiLink
          size="small"
          :icon="srIconById.get(sr.id)"
          :to="{
            name: '/sr/[id]/general',
            params: { id: sr.id },
            query: toSrScopeQuery({ type: SR_SCOPE_TYPE.HOST, hostId: host.id }),
          }"
        >
          {{ sr.name_label }}
        </UiLink>
      </li>
    </UiCollapsibleList>
    <VtsStateHero v-else type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-sr-connected') }}
    </VtsStateHero>
  </UiCard>
</template>

<script lang="ts" setup>
import { useHostSrs } from '@/modules/host/composables/use-host-srs.composable.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getPbdsConnectionStatus } from '@/modules/pbd/utils/xo-pbd.util.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { toSrScopeQuery } from '@/modules/storage-repository/utils/sr-scope.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { objectIcon, type IconName } from '@core/icons'
import { SR_SCOPE_TYPE } from '@core/types/storage-repository.type.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const { srs, hostPbds } = useHostSrs(() => host.id)

const srIconById = computed(() => {
  const iconById = new Map<FrontXoSr['id'], IconName>()

  srs.value.forEach(sr => {
    const pbds = hostPbds.value.filter(pbd => pbd.SR === sr.id)

    iconById.set(sr.id, objectIcon('sr', getPbdsConnectionStatus(pbds)))
  })

  return iconById
})
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;
}
</style>
