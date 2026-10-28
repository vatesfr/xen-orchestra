<template>
  <UiPanelCard class="host-infos-card">
    <UiPanelCardTitle
      :id="host.uuid"
      size="medium"
      :label="host.name_label"
      :icon="hostIcon"
      :to="{ name: '/host/[uuid]/dashboard', params: { uuid: host.uuid } }"
    />
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('state') }}</template>
        <template #value>
          <span class="value">
            <VtsIcon :name="powerState.icon" size="medium" />
            {{ powerState.text }}
          </span>
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('description') }}</template>
        <template #value>{{ host.name_description }}</template>
        <template v-if="host.name_description" #addons>
          <VtsCopyButton :value="host.name_description" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue align-top>
        <template #key>{{ t('tags') }}</template>
        <template #value>
          <UiTagsList v-if="host.tags.length > 0">
            <VtsTag v-for="tag in host.tags" :key="tag" :value="tag" />
          </UiTagsList>
        </template>
        <template v-if="host.tags.length > 0" #addons>
          <VtsCopyButton :value="host.tags.join(', ')" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('status') }}</template>
        <template #value>
          <VtsEnabledState :enabled="host.enabled" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('pool') }}</template>
        <template #value>
          <div v-if="pool !== undefined" class="value">
            <UiLink
              :to="{ name: '/pool/[uuid]/dashboard', params: { uuid: pool.uuid } }"
              size="small"
              icon="object:pool"
            >
              {{ pool.name_label }}
            </UiLink>
          </div>
        </template>
        <template v-if="pool !== undefined" #addons>
          <VtsCopyButton :value="pool.uuid" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('master') }}</template>
        <template #value>
          <div v-if="isMaster" class="value">
            <VtsIcon v-tooltip="t('master')" name="status:primary-circle" size="medium" />
            {{ t('this-host') }}
          </div>
          <div v-else-if="masterHost !== undefined" class="value">
            <UiLink
              :to="{ name: '/host/[uuid]/dashboard', params: { uuid: masterHost.uuid } }"
              size="small"
              :icon="masterHostIcon"
              is-primary
              :primary-tooltip="t('master')"
            >
              {{ masterHost.name_label }}
            </UiLink>
          </div>
        </template>
        <template v-if="masterHost !== undefined" #addons>
          <VtsCopyButton :value="masterHost.uuid" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('started') }}</template>
        <template #value>{{ relativeStartTime }}</template>
        <template v-if="relativeStartTime" #addons>
          <VtsCopyButton :value="relativeStartTime" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('patches') }}</template>
        <template v-if="areAllLoaded" #value>
          <UiInfo v-if="noMissingPatches" accent="success">{{ t('patches-up-to-date') }}</UiInfo>
          <UiInfo v-else accent="warning">{{ t('n-missing', nMissingPatches) }}</UiInfo>
        </template>
        <template v-if="areAllLoaded" #addons>
          <VtsCopyButton :value="noMissingPatches ? t('patches-up-to-date') : t('n-missing', nMissingPatches)" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useHostPatches } from '@/composables/host-patches.composable.ts'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostUtils } from '@/modules/host/composables/host-utils.composable.ts'
import { getHostIcon } from '@/modules/host/utils/host.util.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()

const { pool, masterHost } = usePoolStore().subscribe()
const { getHostPowerState } = useHostMetricsStore().subscribe()

const { isMaster, powerState, relativeStartTime } = useHostUtils(() => host)

const hostIcon = computed(() => getHostIcon(host, getHostPowerState(host)))

const masterHostIcon = computed(() => getHostIcon(masterHost.value, getHostPowerState(masterHost.value)))

const { count: nMissingPatches, areAllLoaded } = useHostPatches(() => [host])

const noMissingPatches = computed(() => nMissingPatches.value === 0)
</script>

<style lang="postcss" scoped>
.host-infos-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .value {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }
  }
}
</style>
