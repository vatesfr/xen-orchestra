<template>
  <UiPanelCard>
    <UiPanelCardTitle size="medium" :label="t('connected-srs')" :counter="srs.length" />
    <VtsStateHero v-if="!isReady" format="card" type="busy" size="extra-small" />
    <VtsStateHero v-else-if="hasError" format="card" type="error" horizontal size="extra-small">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <UiCollapsibleList v-else-if="srs.length > 0" tag="ul" :total-items="srs.length">
      <li v-for="sr in srs" :key="sr.uuid" v-tooltip class="text-ellipsis">
        <UiLink
          size="small"
          :icon="getSrStatusIcon(sr)"
          :to="{ name: '/host/[uuid]/storage', params: { uuid: host.uuid }, query: { id: sr.uuid } }"
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
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useGetPbdsInScope, useSrUtils } from '@/modules/storage-repository/composables/sr-utils.composable.ts'
import { usePbdStore } from '@/stores/xen-api/pbd.store.ts'
import { useSrStore } from '@/stores/xen-api/sr.store.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'
import { logicAnd, logicOr } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()

const { getSrsForHost, isReady: areSrsReady, hasError: hasSrError } = useSrStore().subscribe()
const { isReady: arePbdsReady, hasError: hasPbdError } = usePbdStore().subscribe()

const isReady = logicAnd(areSrsReady, arePbdsReady)

const hasError = logicOr(hasSrError, hasPbdError)

const scope = computed<SrScope>(() => ({ type: SR_SCOPE_TYPE.HOST, hostId: host.$ref }))

const { isConnectedInScope } = useGetPbdsInScope()

const { getSrStatusIcon } = useSrUtils(undefined, scope)

const srs = computed(() => getSrsForHost(host.$ref).filter(sr => isConnectedInScope(sr, scope.value)))
</script>
