<template>
  <VtsStateHero v-if="!isReady" format="card" busy size="medium" />
  <UiCard v-else>
    <UiCardTitle>
      <UiObjectLink :route="`/host/${host.id}/`">
        <template #icon>
          <VtsObjectIcon size="medium" :state="isHostRunning(host.power_state)" type="host" />
        </template>
        {{ host.name_label }}
      </UiObjectLink>
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('state') }}</template>
        <template #value>
          <span class="power-state">
            <VtsIcon :name="powerState.icon" size="medium" />
            {{ powerState.text }}
          </span>
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('uuid') }}</template>
        <template #value>{{ host.id }}</template>
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
          <UiLink size="medium" :to="`/pool/${pool.id}/`" class="link">
            <VtsIcon name="fa:city" size="medium" class="iconNetral" />
            <span v-tooltip class="text-ellipsis"> {{ pool.name_label }}</span>
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
          <UiObjectLink v-else-if="masterHost !== undefined" :route="`/host/${masterHost.id}/`">
            <template #icon>
              <VtsObjectIcon size="medium" :state="isHostRunning(masterHost.power_state)" type="host" />
            </template>
            {{ masterHost.name_label }}
          </UiObjectLink>
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
      <VtsCardRowKeyValue>
        <template #key>{{ t('patches') }}</template>
        <template v-if="noMissingPatches" #value>
          <UiInfo accent="success">{{ t('patches-up-to-date') }}</UiInfo>
        </template>
        <template v-else #value>
          <UiInfo accent="warning">{{ t('n-missing', nMissingPatches) }}</UiInfo>
        </template>
        <template #addons>
          <VtsCopyButton :value="noMissingPatches ? t('patches-up-to-date') : t('n-missing', nMissingPatches)" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection'
import { useXoHostMissingPatchesCollection } from '@/remote-resources/use-xo-host-missing-patches-collection'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection'
import type { XoHost } from '@/types/xo/host.type'
import { HOST_POWER_STATE } from '@/types/xo/host.type'
import type { IconName } from '@core/icons'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { parseDateTime } from '@core/utils/time.util'
import { logicAnd } from '@vueuse/math'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { useGetPoolById, arePoolsReady } = useXoPoolCollection()
const { getMasterHostByPoolId, isMasterHost, areHostsReady } = useXoHostCollection()
const { hostMissingPatches: missingPatches, areHostMissingPatchesReady } = useXoHostMissingPatchesCollection(
  {},
  () => host.id
)
const pool = useGetPoolById(() => host.$pool)

const isReady = logicAnd(arePoolsReady, areHostsReady, areHostMissingPatchesReady)

const isHostRunning = (host: HOST_POWER_STATE) => {
  if (host === HOST_POWER_STATE.RUNNING) {
    return 'running'
  } else if (host === HOST_POWER_STATE.HALTED) {
    return 'halted'
  } else {
    return 'unknown'
  }
}

const powerStateConfig: Record<Lowercase<HOST_POWER_STATE>, IconName | undefined> = {
  running: 'legacy:running',
  halted: 'legacy:halted',
  unknown: undefined,
}

const isMaster = computed(() => isMasterHost(host.id))
const masterHost = computed(() => getMasterHostByPoolId(host.$pool))
const nMissingPatches = computed(() => missingPatches.value.length)
const noMissingPatches = computed(() => nMissingPatches.value === 0)
const powerState = computed(() => {
  const state = toLower(host.power_state)

  return {
    text: t(`host-status.${state}`),
    icon: powerStateConfig[state],
  }
})
</script>

<style scoped lang="postcss">
.content {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .state-wraper {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
  .link {
    width: 100%;
  }

  .iconNetral {
    color: var(--color-neutral-txt-primary);
  }
}
</style>
