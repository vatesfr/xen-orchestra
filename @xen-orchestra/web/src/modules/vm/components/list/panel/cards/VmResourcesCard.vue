<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('resources') }}
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('vcpus') }}</template>
        <template #value>{{ vm.CPUs.number }}</template>
        <template #addons>
          <VtsCopyButton :value="String(vm.CPUs.number)" />
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
        <template v-if="formattedDiskSpace.length > 0" #addons>
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
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSize } from '@core/utils/size.util.ts'
import type { XoVdi } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { getVbdsByIds } = useXoVbdCollection()
const { getVdiById } = useXoVdiCollection()

const formattedRam = computed(() => formatSize(vm.memory.size, 1))

const vdis = computed(() => getVbdsByIds(vm.$VBDs).map(vbd => vbd?.VDI))

const formattedDiskSpace = computed(() => {
  const totalSize = vdis.value
    .map(vdiId => getVdiById(vdiId as XoVdi['id'])?.size || 0)
    .reduce((sum, size) => sum + size, 0)

  return formatSize(totalSize, 1)
})
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
