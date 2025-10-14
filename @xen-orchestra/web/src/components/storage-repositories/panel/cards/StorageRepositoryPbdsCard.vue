<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('pbd-details') }}
    </UiCardTitle>
    <div class="content">
      <template v-for="(pbd, index) in pbds" :key="pbd.id">
        <VtsDivider v-if="index > 0" class="divider" type="stretch" />
        <UiLogEntryViewer
          v-if="pbd.device_config"
          :content="pbd.device_config"
          :label="t('device-config')"
          size="small"
          accent="info"
          class="device-config"
        />
        <VtsCardRowKeyValue>
          <template #key>
            {{ t('current-attach') }}
          </template>
          <template #value>
            {{ pbd.attached }}
          </template>
        </VtsCardRowKeyValue>
      </template>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoPbd } from '@/types/xo/pbd.type'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { useI18n } from 'vue-i18n'

const { pbds } = defineProps<{
  pbds: XoPbd[]
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.card-container {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .divider {
      margin-block: 1.6rem;
    }
    .device-config {
      margin-block-end: 1.6rem;
    }
  }
}
</style>
