<template>
  <UiCard class="card-container">
    <UiLink size="medium" :href="vdiHref" icon="object:vdi">
      {{ vdi.name_label }}
    </UiLink>
    <div class="content">
      <VtsCodeSnippet :content="vdi.id" copy />
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('description') }}</template>
        <template #value>{{ vdi.name_description }}</template>
        <template v-if="vdi.name_description" #addons>
          <VtsCopyButton :value="vdi.name_description" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue align-top>
        <template #key>{{ t('tags') }}</template>
        <template #value>
          <UiTagsList v-if="vdi.tags.length > 0">
            <UiTag v-for="tag in vdi.tags" :key="tag" accent="info" variant="secondary">{{ tag }}</UiTag>
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
import { useVbdsStatus } from '@/modules/vbd/composables/use-vbds-status.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVmVbdsUtils } from '@/modules/vm/composables/xo-vm-vbd-utils.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { CONNECTION_STATUS } from '@/shared/constants.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { useMapper } from '@core/packages/mapper'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi, vm } = defineProps<{
  vdi: FrontXoVdi
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()

const vdiHref = computed(() => buildXo5Route(`/vms/${vm.id}/disks/s=1_6_asc-${vdi.id}`))

const vbdAttachmentStatus = useVbdsStatus(() => vdi.$VBDs)

const vbdsStatus = useMapper(
  () => vbdAttachmentStatus.value,
  {
    allAttached: CONNECTION_STATUS.CONNECTED,
    someAttached: CONNECTION_STATUS.PARTIALLY_CONNECTED,
    noneAttached: CONNECTION_STATUS.DISCONNECTED,
  },
  'noneAttached'
)

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
