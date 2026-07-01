<template>
  <UiCard>
    <UiTitle>
      {{ t('space') }}
    </UiTitle>

    <div>
      <VtsProgressBar :current="sr.physical_usage" :total="sr.size" :label="sr.name_label" legend-type="percent" />

      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('used-space')" :value="usedSpace" />
        <VtsTabularKeyValueRow :label="t('free-space')" :value="freeSpace" />
        <VtsTabularKeyValueRow :label="t('total-space')" :value="totalSpace" />
      </VtsTabularKeyValueList>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsProgressBar from '@core/components/progress-bar/VtsProgressBar.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSize } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { t } = useI18n()

const usedSpace = computed(() => formatSize(sr.physical_usage, 2))
const totalSpace = computed(() => formatSize(sr.size, 2))
const freeSpace = computed(() => formatSize(sr.size - sr.physical_usage, 2))
</script>
