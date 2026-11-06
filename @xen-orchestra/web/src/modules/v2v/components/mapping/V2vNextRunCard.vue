<template>
  <UiPanelCard class="v2v-next-run-card">
    <UiPanelCardTitle size="medium" :label="t('next-run')" />
    <div class="content">
      <UiInfo v-if="transfer === 'full'" accent="warning" wrap>{{ t('v2v:source-snapshot-changed') }}</UiInfo>
      <VtsCardRowKeyValue>
        <template #key>{{ t('type') }}</template>
        <template #value>{{ nextTransferLabels[transfer] }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('last-sync') }}</template>
        <template #value>{{ lastSync }}</template>
      </VtsCardRowKeyValue>
      <UiInfo accent="info" wrap>{{ t('v2v:next-run-reminder') }}</UiInfo>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import type { V2vNextTransfer } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { formatDateTime } from '@core/utils/time.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { lastSyncAt } = defineProps<{
  transfer: V2vNextTransfer
  lastSyncAt?: number
}>()

const { t } = useI18n()

const { nextTransferLabels } = useV2vVmLabels()

const lastSync = computed(() => (lastSyncAt === undefined ? undefined : formatDateTime(lastSyncAt)))
</script>

<style lang="postcss" scoped>
.v2v-next-run-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
