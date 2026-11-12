<template>
  <UiPanelCard class="v2v-vm-source-card">
    <UiPanelCardTitle size="medium" :label="t('source')" />
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('power-state') }}</template>
        <template #value>{{ getPowerLabel(vm.powerState, hostName) }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('cpu') }}</template>
        <template #value>{{ t('n-vcpus', vm.nCpus) }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('memory') }}</template>
        <template #value>{{ formatSize(vm.memory, 1) }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('boot-firmware') }}</template>
        <template #value>{{ vm.firmware }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('secure-boot') }}</template>
        <template #value>
          <VtsStatus :status="vm.secureBoot" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('disks') }}</template>
        <template #value>
          <InlineParts>
            <span v-for="part of getDisksParts(vm.disks)" :key="part">{{ part }}</span>
          </InlineParts>
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('snapshots') }}</template>
        <template #value>{{ getSnapshotCountLabel(vm.snapshotCount) }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('description') }}</template>
        <template #value>{{ vm.description }}</template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import InlineParts from '@/shared/components/InlineParts.vue'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { formatSize } from '@core/utils/size.util.ts'
import type { XoV2vVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

defineProps<{
  vm: XoV2vVm
  hostName?: string
}>()

const { t } = useI18n()

const { getPowerLabel, getDisksParts, getSnapshotCountLabel } = useV2vVmLabels()
</script>

<style lang="postcss" scoped>
.v2v-vm-source-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
