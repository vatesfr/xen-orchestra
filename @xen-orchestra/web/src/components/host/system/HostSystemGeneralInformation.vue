<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <VtsQuickInfoRow :label="t('name')" :value="host.name_label" />
    <VtsQuickInfoRow :label="t('uuid')" :value="host.id" />
    <VtsQuickInfoRow :label="t('description')" :value="host.name_description" />
    <VtsQuickInfoRow :label="t('tags')">
      <template v-if="host.tags.length > 0" #value>
        <UiTagsList>
          <UiTag v-for="tag in host.tags" :key="tag" accent="info" variant="secondary">
            {{ tag }}
          </UiTag>
        </UiTagsList>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('status')">
      <template #value>
        <VtsStatus :status="host.enabled" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('pool')">
      <template v-if="pool !== undefined" #value>
        <UiLink size="medium" :to="`/pool/${pool.id}/dashboard`" icon="fa:city">
          {{ pool.name_label }}
        </UiLink>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('master')">
      <template #value>
        <template v-if="isMaster">
          <VtsIcon v-tooltip="t('master')" name="legacy:primary" size="medium" />
          {{ t('this-host') }}
        </template>
        <UiLink v-else-if="masterHost !== undefined" size="medium" :to="`/host/${masterHost.id}/`" icon="fa:server">
          {{ masterHost.name_label }}
        </UiLink>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('started')">
      <template v-if="host.power_state === HOST_POWER_STATE.RUNNING && host.startTime" #value>
        <VtsRelativeTime :date="host.startTime * 1000" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('power-on-mode')">
      <template #value>
        <VtsStatus :status="host.powerOnMode !== ''" />
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { HOST_POWER_STATE, type XoHost } from '@vates/types'
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
