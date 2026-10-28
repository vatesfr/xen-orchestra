<template>
  <UiCard>
    <UiCardTitle>{{ t('source') }}</UiCardTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('power-state')" :value="getPowerLabel(vm.powerState, hostName)" />
      <VtsTabularKeyValueRow :label="t('cpu')" :value="t('n-vcpus', vm.nCpus)" />
      <VtsTabularKeyValueRow :label="t('memory')" :value="formatSize(vm.memory, 1)" />
      <VtsTabularKeyValueRow :label="t('boot-firmware')" :value="vm.firmware" />
      <VtsTabularKeyValueRow :label="t('secure-boot')">
        <template #value>
          <VtsStatus :status="vm.secureBoot" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('disks')">
        <template #value>
          <InlineParts>
            <span v-for="part of getDisksParts(vm.disks)" :key="part">{{ part }}</span>
          </InlineParts>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('snapshots')" :value="getSnapshotCountLabel(vm.snapshotCount)" />
      <VtsTabularKeyValueRow :label="t('description')" :value="vm.description" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script lang="ts" setup>
import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import InlineParts from '@/shared/components/InlineParts.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
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
