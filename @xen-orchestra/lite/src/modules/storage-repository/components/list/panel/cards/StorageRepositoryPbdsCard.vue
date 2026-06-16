<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('pbd-details') }}
    </UiCardTitle>
    <VtsStateHero v-if="pbdsInScope.length === 0" type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-pbd-attached') }}
    </VtsStateHero>
    <template v-else>
      <div class="content">
        <VtsStatus :status="srConnectionStatus" />
      </div>
      <div v-if="areSomePbdsDisconnected" class="content">
        <template v-for="(pbd, index) in disconnectedPbds" :key="pbd.uuid">
          <VtsDivider v-if="index > 0" class="divider" type="stretch" />
          <span class="typo-body-bold-small subtitle">{{ t('disconnected-pbd-number', { n: index + 1 }) }}</span>
          <StorageRepositoryPbdHost :pbd />
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('current-attach') }}
            </template>
            <template #value>
              <VtsStatus
                :status="pbd.currently_attached ? CONNECTION_STATUS.CONNECTED : CONNECTION_STATUS.DISCONNECTED"
              />
            </template>
          </VtsCardRowKeyValue>
          <UiLogEntryViewer
            v-if="Object.keys(pbd.device_config).length > 0"
            :content="pbd.device_config"
            :label="t('device-config')"
            size="small"
            accent="info"
          />
        </template>
      </div>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XenApiSr } from '@/libs/xen-api/xen-api.types'
import StorageRepositoryPbdHost from '@/modules/storage-repository/components/list/panel/card-items/StorageRepositoryPbdHost.vue'
import { CONNECTION_STATUS, usePbdUtils } from '@/modules/storage-repository/composables/pbd-utils.composable'
import { useSrUtils } from '@/modules/storage-repository/composables/sr-utils.composable'
import type { SrScope } from '@/modules/storage-repository/types/storage-repository.type'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { useI18n } from 'vue-i18n'

const { sr, scope } = defineProps<{
  sr: XenApiSr
  scope: SrScope
}>()

const { t } = useI18n()

const { pbdsInScope, srConnectionStatus } = useSrUtils(
  () => sr,
  () => scope
)

const { areSomePbdsDisconnected, disconnectedPbds } = usePbdUtils(pbdsInScope)
</script>

<style scoped lang="postcss">
.card-container {
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
