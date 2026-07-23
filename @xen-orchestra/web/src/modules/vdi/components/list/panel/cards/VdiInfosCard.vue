<template>
  <UiCard class="card-container">
    <VtsCardObjectTitle
      :id="vdi.id"
      :label="vdi.name_label"
      :to="{ name: '/vdi/[id]/general', params: { id: vdi.id }, query: { from: VDI_PAGE_CONTEXT.VM } }"
      :icon="vdiIcon"
    />
    <div class="content">
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
            <VtsTag v-for="tag in vdi.tags" :key="tag" :value="tag" />
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
import { useVbdsStatus, type VbdAttachmentStatus } from '@/modules/vbd/composables/use-vbds-status.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVmVbdsUtils } from '@/modules/vm/composables/xo-vm-vbd-utils.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { VDI_PAGE_CONTEXT } from '@/shared/constants.ts'
import type { IconName } from '@core/icons'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardObjectTitle from '@core/components/card-object-title/VtsCardObjectTitle.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { useMapper } from '@core/packages/mapper'
import { CONNECTION_STATUS } from '@core/types/connection.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi, vm } = defineProps<{
  vdi: FrontXoVdi
  vm: FrontXoVm
}>()

const { t } = useI18n()

const vbdsAttachmentStatus = useVbdsStatus(() => vdi.$VBDs)

const vdiIcon = useMapper<VbdAttachmentStatus, IconName>(
  () => vbdsAttachmentStatus.value,
  {
    allAttached: 'object:vdi:attached',
    someAttached: 'object:vdi:warning',
    noneAttached: 'object:vdi:detached',
  },
  'noneAttached'
)

const vbdsStatus = useMapper<VbdAttachmentStatus, (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS]>(
  () => vbdsAttachmentStatus.value,
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
