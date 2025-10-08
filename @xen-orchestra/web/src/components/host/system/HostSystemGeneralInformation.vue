<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <UiLabelValue :label="t('name')" :value="host.name_label" />
    <UiLabelValue :label="t('uuid')" :value="host.id" />
    <UiLabelValue :label="t('description')" :value="host.name_description" />
    <UiLabelValue :label="t('tags')" :value="host.tags" />
    <UiLabelValue :label="t('status')">
      <template #value>
        <VtsStatus :status="host.enabled" />
      </template>
    </UiLabelValue>
    <UiLabelValue :label="t('pool')">
      <template v-if="pool !== undefined" #value>
        <UiLink size="medium" :to="`/pool/${pool.id}/`" icon="fa:city" class="link">
          <div v-tooltip class="text-ellipsis">
            {{ pool.name_label }}
          </div>
        </UiLink>
      </template>
    </UiLabelValue>
    <UiLabelValue :label="t('master')">
      <template #value>
        <template v-if="isMaster">
          <VtsIcon v-tooltip="t('master')" name="legacy:primary" size="medium" />
          {{ t('this-host') }}
        </template>
        <UiLink
          v-else-if="masterHost !== undefined"
          size="medium"
          :to="`/host/${masterHost.id}/`"
          icon="fa:server"
          class="link"
        >
          <div v-tooltip class="text-ellipsis">
            {{ masterHost.name_label }}
          </div>
        </UiLink>
      </template>
    </UiLabelValue>
    <UiLabelValue :label="t('started')">
      <template v-if="host.power_state === HOST_POWER_STATE.RUNNING" #value>
        <VtsRelativeTime :date="host.startTime * 1000" />
      </template>
    </UiLabelValue>
    <UiLabelValue :label="t('power-on-mode')">
      <template #value>
        <VtsStatus :status="host.powerOnMode !== ''" />
      </template>
    </UiLabelValue>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import { HOST_POWER_STATE, type XoHost } from '@/types/xo/host.type.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { useGetPoolById } = useXoPoolCollection()

const { getMasterHostByPoolId, isMasterHost } = useXoHostCollection()

const pool = useGetPoolById(() => host.$pool)

const isMaster = computed(() => isMasterHost(host.id))

const masterHost = computed(() => getMasterHostByPoolId(host.$pool))
</script>

<style lang="postcss" scoped>
.link {
  width: 100%;
}
</style>
