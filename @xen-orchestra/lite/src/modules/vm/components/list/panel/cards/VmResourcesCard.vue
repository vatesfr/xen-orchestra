<template>
  <UiPanelCard>
    <UiPanelCardTitle size="medium" :label="t('resources')" />
    <VtsCardRowList>
      <VtsCardRowKeyValue>
        <template #key>{{ t('vcpus') }}</template>
        <template #value>{{ vcpus }}</template>
        <template #addons>
          <VtsCopyButton :value="String(vcpus)" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('ram') }}</template>
        <template #value>{{ formattedRam }}</template>
        <template #addons>
          <VtsCopyButton :value="formattedRam" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('disk-space') }}</template>
        <template #value>{{ formattedDiskSpace }}</template>
        <template #addons>
          <VtsCopyButton :value="formattedDiskSpace" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('vdis') }}</template>
        <template v-if="vdis.length > 0" #value>{{ vdis.length }}</template>
        <template v-if="vdis.length > 0" #addons>
          <VtsCopyButton :value="String(vdis.length)" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('snapshots') }}</template>
        <template v-if="vm.snapshots.length > 0" #value>{{ vm.snapshots.length }}</template>
        <template v-if="vm.snapshots.length > 0" #addons>
          <VtsCopyButton :value="String(vm.snapshots.length)" />
        </template>
      </VtsCardRowKeyValue>
    </VtsCardRowList>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { useVmResources } from '@/modules/vm/composables/vm-resources.composable.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { formatSize } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XenApiVm
}>()

const { t } = useI18n()

const { vcpus, vdis, diskSize } = useVmResources(() => vm)

const formattedRam = computed(() => formatSize(vm.memory_dynamic_max, 0))

const formattedDiskSpace = computed(() => formatSize(diskSize.value, 1))
</script>
