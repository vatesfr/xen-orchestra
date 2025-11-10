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
        <template #value>{{ ram }}</template>
        <template #addons>
          <VtsCopyButton :value="String(ram)" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('disk-space') }}</template>
        <template #value>{{ diskSpace }}</template>
        <template #addons>
          <VtsCopyButton :value="String(diskSpace)" />
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
        <template v-if="vm.snapshots.length > 0" #value>{{ vm?.snapshots.length }}</template>
        <template v-if="vm.snapshots.length > 0" #addons>
          <VtsCopyButton :value="String(vm.snapshots.length)" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoVbdCollection } from '@/remote-resources/use-xo-vbd-collection.ts'
import { useXoVdiCollection } from '@/remote-resources/use-xo-vdi-collection.ts'
import type { XoVbd } from '@/types/xo/vbd.type.ts'
import type { XoVm } from '@/types/xo/vm.type.ts'
import { getVmRam } from '@/utils/xo-records/vm.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { getVbdById } = useXoVbdCollection()
const { getVdiById } = useXoVdiCollection()

const ram = computed(() => {
  const ramValue = getVmRam(vm)

  return `${ramValue?.value} ${ramValue?.prefix}`
})

const vdis = computed(() => [...vm.$VBDs].map(vbdId => getVbdById(vbdId as XoVbd['id'])?.VDI))

const diskSpace = computed(() => {
  const totalSize = vdis.value.map(vdiId => getVdiById(vdiId)?.size || 0).reduce((sum, size) => sum + size, 0)

  const diskSpaceValue = formatSizeRaw(totalSize, 1)

  return `${diskSpaceValue?.value} ${diskSpaceValue?.prefix}`
})
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
}
</style>
