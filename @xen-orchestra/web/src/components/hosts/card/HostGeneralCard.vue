<template>
  <VtsStateHero v-if="!arePoolsReady || !areHostsReady" format="card" busy size="medium" />
  <UiCard v-if="arePoolsReady && areHostsReady">
    <UiCardTitle>
      <UiLink
        :icon="`object:host:${isHostRunning(host.power_state) ?? 'muted'}`"
        :to="`/host/${host.id}/`"
        size="medium"
      >
        {{ host.name_label }}
      </UiLink>
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('state') }}
        </template>
        <template #value>
          <span>
            <VtsIcon class="icon" :name="`legacy:${isHostRunning(host.power_state) ?? 'status:muted'}`" size="medium" />
            {{ t(`host-status.${host.power_state.toLowerCase()}`) }}
          </span>
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('uuid') }}
        </template>
        <template #value> {{ host.id }} </template>
        <template #addons>
          <VtsCopyButton :value="host.id" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue wrap>
        <template #key>{{ t('description') }}</template>
        <template #value>{{ host.name_description }}</template>
        <template #addons>
          <VtsCopyButton :value="host.name_description" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('tags') }}</template>
        <template #value>
          <UiTagsList v-if="host.tags.length > 0">
            <UiTag v-for="tag in host.tags" :key="tag" accent="info" variant="primary">
              {{ tag }}
            </UiTag>
          </UiTagsList>
        </template>
        <template v-if="host.tags.length > 0" #addons>
          <VtsCopyButton :value="host.name_description" />
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
        <template v-if="pool !== undefined" #value>
          <UiLink size="medium" :to="`/pool/${pool.id}/`" icon="fa:city">
            {{ pool.name_label }}
          </UiLink>
        </template>
        <template v-if="pool !== undefined" #addons>
          <VtsCopyButton :value="pool.id" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('master') }}</template>
        <template #value>
          <template v-if="isMaster">
            <VtsIcon v-tooltip="t('master')" name="legacy:primary" size="medium" />
            {{ t('this-host') }}
          </template>
          <UiLink v-else-if="masterHost !== undefined" size="medium" :to="`/host/${masterHost.id}/`" icon="fa:server">
            {{ masterHost.name_label }}
          </UiLink>
        </template>
        <template v-if="masterHost !== undefined" #addons>
          <VtsCopyButton :value="masterHost.id" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('started') }}</template>
        <template v-if="host.power_state === HOST_POWER_STATE.RUNNING" #value>
          <VtsRelativeTime :date="host.startTime * 1000" />
        </template>
        <template v-if="host.power_state === HOST_POWER_STATE.RUNNING" #addons>
          <VtsCopyButton :value="new Date(parseDateTime(host.startTime * 1000)).toDateString()" />
        </template>
      </VtsCardRowKeyValue>
      <!-- #TODO patches -->
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection'
import type { XoHost } from '@/types/xo/host.type'
import { HOST_POWER_STATE } from '@/types/xo/host.type'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { parseDateTime } from '@core/utils/time.util'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { useGetPoolById, arePoolsReady } = useXoPoolCollection()
const { getMasterHostByPoolId, isMasterHost, areHostsReady } = useXoHostCollection()

const isHostRunning = (host: HOST_POWER_STATE) => {
  if (host === HOST_POWER_STATE.RUNNING) {
    return 'running'
  } else if (host === HOST_POWER_STATE.HALTED) {
    return 'halted'
  } else {
    return undefined
  }
}
const pool = useGetPoolById(() => host.$pool)
const isMaster = computed(() => isMasterHost(host.id))
const masterHost = computed(() => getMasterHostByPoolId(host.$pool))
</script>

<style scoped lang="postcss">
.content {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
