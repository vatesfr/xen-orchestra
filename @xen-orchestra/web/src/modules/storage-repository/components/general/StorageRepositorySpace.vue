<template>
  <UiCard>
    <UiTitle>
      {{ t('space') }}
    </UiTitle>

    <div>
      <VtsProgressBar :current="sr.physical_usage" :total="sr.size" :label="sr.name_label" legend-type="percent" />

      <UiAlert v-if="srUsageExceeds80Percent" class="sr-usage-exceeded-alert" accent="warning">
        {{ t('sr-usage-exceeds-80-percent') }}
      </UiAlert>

      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('vdis-allocated-space')" :value="vdisAllocatedSpace" />
      </VtsTabularKeyValueList>
      <div v-if="vdiAllocatedSpaceExceedsSr" class="vdis-allocated-space-warning">
        <VtsIcon name="status:warning-circle" size="current" />
        <span class="label">{{ t('vdi-allocated-space-exceeds-sr') }}</span>
      </div>
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
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsProgressBar from '@core/components/progress-bar/VtsProgressBar.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
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

const srUsageExceeds80Percent = computed(() => sr.size > 0 && sr.physical_usage / sr.size > 0.8)
const vdiAllocatedSpaceExceedsSr = computed(() => sr.usage > sr.size - sr.physical_usage)
</script>

<style scoped lang="postcss">
.vdis-allocated-space-warning {
  display: flex;
  align-items: center;
  margin: 1rem 0;

  .label {
    margin-left: 2rem;
  }
}

.sr-usage-exceeded-alert {
  margin: 2rem 0;
}
</style>
