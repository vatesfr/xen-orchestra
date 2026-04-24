<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('name')" :value="host.name_label" />
      <VtsTabularKeyValueRow :label="t('uuid')" :value="host.id" />
      <VtsTabularKeyValueRow :label="t('description')" :value="host.name_description" />
      <VtsTabularKeyValueRow :label="t('tags')">
        <template v-if="host.tags.length > 0" #value>
          <UiTagsList>
            <UiTag v-for="tag in host.tags" :key="tag" accent="info" variant="secondary">
              {{ tag }}
            </UiTag>
          </UiTagsList>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('status')">
        <template #value>
          <VtsStatus :status="host.enabled" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('pool')">
        <template v-if="pool !== undefined" #value>
          <UiLink size="medium" :to="{ name: '/pool/[id]/dashboard', params: { id: pool.id } }" icon="object:pool">
            {{ pool.name_label }}
          </UiLink>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('master')">
        <template #value>
          <template v-if="isMaster">
            <VtsIcon v-tooltip="t('master')" name="status:primary-circle" size="medium" />
            {{ t('this-host') }}
          </template>
          <UiLink
            v-else-if="masterHost !== undefined"
            size="medium"
            :to="{ name: '/host/[id]/dashboard', params: { id: masterHost.id } }"
            :icon="`object:host:${toLower(masterHost.power_state)}`"
          >
            {{ masterHost.name_label }}
          </UiLink>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('started')">
        <template v-if="host.power_state === HOST_POWER_STATE.RUNNING && host.startTime" #value>
          <VtsRelativeTime :date="host.startTime * 1000" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('power-on-mode')">
        <template #value>
          <VtsStatus :status="host.powerOnMode !== ''" />
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoHostCollection, type FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const { useGetPoolById } = useXoPoolCollection()

const { getMasterHostByPoolId, isMasterHost } = useXoHostCollection()

const pool = useGetPoolById(() => host.$pool)

const isMaster = computed(() => isMasterHost(host.id))

const masterHost = computed(() => getMasterHostByPoolId(host.$pool))
</script>
