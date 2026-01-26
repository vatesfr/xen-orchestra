<template>
  <UiCard class="card-container">
    <UiLink size="medium" :href="vdiHref" icon="object:vdi">
      {{ vdi.name_label }}
    </UiLink>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('uuid') }}</template>
        <template #value>
          {{ vdi.id }}
        </template>
        <template #addons>
          <VtsCopyButton :value="vdi.id" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('description') }}</template>
        <template #value>{{ vdi.name_description }}</template>
        <template v-if="vdi.name_description" #addons>
          <VtsCopyButton :value="vdi.name_description" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('tags') }}</template>
        <template #value>
          <UiTagsList v-if="vdi.tags.length > 0">
            <UiTag v-for="(tag, index) in vdi.tags" :key="index" accent="info" variant="secondary">
              {{ tag }}
            </UiTag>
          </UiTagsList>
        </template>
        <template v-if="vdi.tags.length > 0" #addons>
          <VtsCopyButton :value="vdi.tags.join(', ')" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('status') }}</template>
        <template #value>
          <VtsStatus :status="vbdsStatus" />
        </template>
        <template #addons>
          <VtsCopyButton :value="vbdsStatus" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('device') }}</template>
        <template #value>{{ vdiDevice }}</template>
        <template v-if="vdiDevice" #addons>
          <VtsCopyButton :value="vdiDevice" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useXoVmVbdsUtils } from '@/modules/vm/composables/xo-vm-vbd-utils.composable.ts'
import { CONNECTION_STATUS } from '@/shared/constants.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import type { XoVdi, XoVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi, vm } = defineProps<{
  vdi: XoVdi
  vm: XoVm
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()

const { getVbdsByIds } = useXoVbdCollection()

const vdiHref = computed(() => buildXo5Route(`/vms/${vm.id}/disks/s=1_6_asc-${vdi.id}`))

const vbdsStatus = computed(() => {
  const vdiVbds = getVbdsByIds(vdi.$VBDs)
  if (vdiVbds.length === 0) {
    return CONNECTION_STATUS.DISCONNECTED
  }

  const areVdiVbdsAttached = vdiVbds.map(vbd => vbd.attached)

  if (areVdiVbdsAttached.every(Boolean)) {
    return CONNECTION_STATUS.CONNECTED
  }

  if (areVdiVbdsAttached.some(Boolean)) {
    return CONNECTION_STATUS.PARTIALLY_CONNECTED
  }

  return CONNECTION_STATUS.DISCONNECTED
})

const { notCdDriveVbds } = useXoVmVbdsUtils(() => vm)

const vdiDevice = computed(() => notCdDriveVbds.value.find(vbd => vbd.VDI === vdi.id)?.device ?? '')
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
