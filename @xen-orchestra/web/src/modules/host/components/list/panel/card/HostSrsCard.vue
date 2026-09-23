<template>
  <UiPanelCard>
    <UiCardTitle>
      {{ t('connected-srs') }}
      <UiCounter :value="srs.length" accent="neutral" size="small" variant="primary" />
    </UiCardTitle>
    <VtsStateHero v-if="!isReady" format="card" type="busy" size="extra-small" />
    <VtsStateHero v-else-if="hasFetchError" format="card" type="error" horizontal size="extra-small">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <UiCollapsibleList v-else-if="srs.length > 0" tag="ul" :total-items="srs.length">
      <li v-for="sr in srs" :key="sr.id" v-tooltip class="text-ellipsis">
        <UiLink
          size="small"
          :icon="connectedSrIcon"
          :to="{ name: '/sr/[id]/general', params: { id: sr.id }, query: srScopeQuery }"
        >
          {{ sr.name_label }}
        </UiLink>
      </li>
    </UiCollapsibleList>
    <VtsStateHero v-else type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-sr-connected') }}
    </VtsStateHero>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { useGetPbdsInScope } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { toSrScopeQuery, type XoSrScope } from '@/modules/storage-repository/utils/sr-scope.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { objectIcon } from '@core/icons'
import { CONNECTION_STATUS } from '@core/types/connection.ts'
import { SR_SCOPE_TYPE } from '@core/types/storage-repository.type.ts'
import { logicAnd, logicOr } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const { srsByHost, areSrsReady, hasSrFetchError } = useXoSrCollection()
const { arePbdsReady, hasPbdFetchError } = useXoPbdCollection()

const isReady = logicAnd(areSrsReady, arePbdsReady)

const hasFetchError = logicOr(hasSrFetchError, hasPbdFetchError)

const scope = computed<XoSrScope>(() => ({ type: SR_SCOPE_TYPE.HOST, hostId: host.id }))

const { isConnectedInScope } = useGetPbdsInScope()

const srScopeQuery = computed(() => toSrScopeQuery(scope.value))

// The list only contains SRs connected to this host, so they all share the same icon
const connectedSrIcon = objectIcon('sr', CONNECTION_STATUS.CONNECTED)

const srs = computed(() => {
  const hostSrs = srsByHost.value.get(host.id) ?? []

  return hostSrs.filter(sr => isConnectedInScope(sr, scope.value))
})
</script>
