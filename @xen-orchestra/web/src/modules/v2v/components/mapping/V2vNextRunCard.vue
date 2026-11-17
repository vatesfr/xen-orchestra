<template>
  <UiPanelCard class="v2v-next-run-card">
    <UiPanelCardTitle size="medium" :label="t('next-run')" />
    <div class="content">
      <V2vSourceSnapshotChangedInfo />
      <VtsCardRowKeyValue>
        <template #key>{{ t('last-sync') }}</template>
        <template #value>{{ lastSync }}</template>
      </VtsCardRowKeyValue>
      <UiInfo accent="info" wrap>{{ t('v2v:next-run-reminder') }}</UiInfo>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import V2vSourceSnapshotChangedInfo from '@/modules/v2v/components/mapping/V2vSourceSnapshotChangedInfo.vue'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { formatDateTime } from '@core/utils/time.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { lastSyncAt } = defineProps<{
  lastSyncAt?: number
}>()

const { t } = useI18n()

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
