<template>
  <UiCard>
    <UiTitle>
      {{ t('space') }}
    </UiTitle>

    <UiAlert v-if="isUnwritableSr" class="sr-unwritable-alert" accent="info">
      {{ t('sr-is-unwritable') }}
    </UiAlert>

    <div>
      <VtsProgressBar
        class="progress-bar"
        :current="sr.physical_usage"
        :total="sr.size"
        :label="sr.name_label"
        legend-type="percent"
      />

      <UiAlert v-if="srUsageWarning" class="sr-usage-exceeded-alert" :accent="srUsageAccent">
        {{ t('sr-usage-exceeds-80-percent') }}
      </UiAlert>

      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('vdis-allocated-space')" :value="vdisAllocatedSpace" />
      </VtsTabularKeyValueList>
      <UiInfo v-if="vdiAllocatedSpaceWarning" class="vdis-allocated-space-warning" accent="warning" wrap>
        {{ t('vdi-allocated-space-exceeds-sr') }}
      </UiInfo>
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('used-space-on-sr')" :value="usedSpace" />
        <VtsTabularKeyValueRow :label="t('free-space-on-sr')" :value="freeSpace" />
        <VtsTabularKeyValueRow :label="t('total-space-on-sr')" :value="totalSpace" />
      </VtsTabularKeyValueList>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { isSrWritable } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import VtsProgressBar from '@core/components/progress-bar/VtsProgressBar.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSize } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { t } = useI18n()

const vdisAllocatedSpace = computed(() => formatSize(sr.usage, 2))
const usedSpace = computed(() => formatSize(sr.physical_usage, 2))
const totalSpace = computed(() => formatSize(sr.size, 2))
const freeSpace = computed(() => formatSize(sr.size - sr.physical_usage, 2))

const isUnwritableSr = computed(() => !isSrWritable(sr))

const srUsagePercentage = computed(() => (sr.size > 0 ? (sr.physical_usage / sr.size) * 100 : 0))
const srUsageWarning = computed(() => srUsagePercentage.value > 80)
const srUsageAccent = computed(() => (srUsagePercentage.value >= 90 ? 'danger' : 'warning'))
const vdiAllocatedSpaceWarning = computed(() => sr.usage > sr.size - sr.physical_usage)
</script>

<style scoped lang="postcss">
.progress-bar {
  margin: 0 0 2rem;
}

.sr-unwritable-alert,
.sr-usage-exceeded-alert,
.vdis-allocated-space-warning {
  margin: 2rem 0;
}
</style>
