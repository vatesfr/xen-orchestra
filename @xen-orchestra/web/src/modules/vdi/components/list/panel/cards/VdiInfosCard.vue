<template>
  <UiPanelCard class="vdi-infos-card">
    <VtsCardObjectTitle :id="vdi.id" :label="vdi.name_label" :to="vdiPageLocation" :icon="vdiIcon" />
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
      <VtsCardRowKeyValue v-if="vdiDevice !== undefined">
        <template #key>{{ t('device') }}</template>
        <template #value>{{ vdiDevice }}</template>
        <template v-if="vdiDevice" #addons>
          <VtsCopyButton :value="vdiDevice" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useVbdsStatus, type VbdAttachmentStatus } from '@/modules/vbd/composables/use-vbds-status.composable.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import { getVdiPageLocation } from '@/modules/vdi/utils/xo-vdi.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { IconName } from '@core/icons'
import type { SrScope } from '@core/types/storage-repository.type.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardObjectTitle from '@core/components/card-object-title/VtsCardObjectTitle.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { useMapper } from '@core/packages/mapper'
import { CONNECTION_STATUS } from '@core/types/connection.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi, vm, vbd, srScope } = defineProps<{
  vdi: FrontXoVdi | FrontXoVdiSnapshot
  vm?: FrontXoVm
  vbd?: FrontXoVbd
  srScope?: SrScope
}>()

const { t } = useI18n()

const vdiPageLocation = computed(() => getVdiPageLocation(vdi, { vm, srScope }))

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

const vdiDevice = computed(() => (vbd === undefined || vbd.is_cd_drive ? undefined : (vbd.device ?? '')))
</script>

<style scoped lang="postcss">
.vdi-infos-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
