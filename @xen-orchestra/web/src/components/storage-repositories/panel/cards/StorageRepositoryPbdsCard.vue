<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('pbd-details') }}
      <UiCounter v-if="areSomePbdsDisconnected" :value="pbds.length" accent="neutral" size="small" variant="primary" />
    </UiCardTitle>
    <div class="content">
      <VtsStatus :status="allPbdsConnectionStatus" />
    </div>
    <div v-if="areSomePbdsDisconnected" class="content">
      <template v-for="(pbd, index) in disconnectedPbds" :key="pbd.id">
        <VtsDivider v-if="index > 0" class="divider" type="stretch" />
        <span class="typo-body-bold-small subtitle">{{ t('disconnected-pbd-number', { n: index + 1 }) }}</span>
        <StorageRepositoryPbdHost :pbd />
        <VtsCardRowKeyValue>
          <template #key>
            {{ t('current-attach') }}
          </template>
          <template #value>
            <VtsStatus :status="pbd.attached ? 'connected' : 'disconnected'" />
          </template>
        </VtsCardRowKeyValue>
        <UiLogEntryViewer
          v-if="pbd.device_config"
          :content="pbd.device_config"
          :label="t('device-config')"
          size="small"
          accent="info"
        />
      </template>
    </div>
    <VtsStateHero v-if="pbds.length === 0" type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-pbds-attached') }}
    </VtsStateHero>
  </UiCard>
</template>

<script lang="ts" setup>
import StorageRepositoryPbdHost from '@/components/storage-repositories/panel/card-items/StorageRepositoryPbdHost.vue'
import { useXoPbdUtils } from '@/composables/xo-pbd-utils.composable'
import type { XoPbd } from '@/types/xo/pbd.type'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { useI18n } from 'vue-i18n'

const { pbds } = defineProps<{
  pbds: XoPbd[]
}>()

const { t } = useI18n()

const { areSomePbdsDisconnected, allPbdsConnectionStatus, disconnectedPbds } = useXoPbdUtils(() => pbds)
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

    .subtitle {
      margin-block-end: 0.4rem;
    }

    .divider {
      margin-block: 1.6rem;
    }
  }
}
</style>
