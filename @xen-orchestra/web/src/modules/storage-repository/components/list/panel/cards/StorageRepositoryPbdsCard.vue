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
        <VtsStatus :status="pbdsConnectionStatus" />
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
              <VtsStatus :status="pbd.attached ? CONNECTION_STATUS.CONNECTED : CONNECTION_STATUS.DISCONNECTED" />
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
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoPbdUtils } from '@/modules/pbd/composables/xo-pbd-utils.composable.ts'
import StorageRepositoryPbdHost from '@/modules/storage-repository/components/list/panel/card-items/StorageRepositoryPbdHost.vue'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { StorageScope } from '@/modules/storage-repository/types/storage-scope.type.ts'
import { CONNECTION_STATUS } from '@/shared/constants.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  sr: FrontXoSr
  scope: StorageScope
}>()

const { t } = useI18n()

const { pbdsInScope, pbdsConnectionStatus } = useXoSrUtils(
  () => props.sr,
  () => props.scope
)

const { areSomePbdsDisconnected, disconnectedPbds } = useXoPbdUtils(pbdsInScope)
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
