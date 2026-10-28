<template>
  <UiCard>
    <UiCardTitle>
      {{ t('next-run') }}
      <template #description>{{ nextTransferLabels[transfer] }}</template>
    </UiCardTitle>
    <UiInfo v-if="transfer === 'full'" accent="warning" wrap>{{ t('v2v:source-snapshot-changed') }}</UiInfo>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow
        :label="t('last-sync')"
        :value="lastSyncAt === undefined ? undefined : formatDateTime(lastSyncAt)"
      />
    </VtsTabularKeyValueList>
    <UiInfo accent="info" wrap>{{ t('v2v:next-run-reminder') }}</UiInfo>
  </UiCard>
</template>

<script lang="ts" setup>
import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import type { V2vNextTransfer } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { formatDateTime } from '@core/utils/time.util.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  transfer: V2vNextTransfer
  lastSyncAt?: number
}>()

const { t } = useI18n()

const { nextTransferLabels } = useV2vVmLabels()
</script>
