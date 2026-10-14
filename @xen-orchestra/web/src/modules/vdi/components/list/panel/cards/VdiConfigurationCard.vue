<template>
  <UiPanelCard class="vdi-configuration-card">
    <UiPanelCardTitle size="medium" :label="t('configuration')" />
    <div class="content">
      <VdiFormatCardItem :format="vdi.image_format" />
      <VtsCardRowKeyValue v-if="isFromSr" align-top>
        <template #key>
          {{ t('vms') }}
        </template>
        <template #value>
          <VmLinkList :vms />
        </template>
        <template v-if="vms.length > 0" #addons>
          <VtsCopyButton :value="vmNames" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-else>
        <template #key>
          {{ t('storage') }}
        </template>
        <template #value>
          <SrLink v-if="sr" :sr />
        </template>
        <template v-if="sr" #addons>
          <VtsCopyButton :value="sr.name_label" />
        </template>
      </VtsCardRowKeyValue>
      <template v-if="isFromVm">
        <VtsCardRowKeyValue>
          <template #key>
            {{ t('read-only') }}
          </template>
          <template #value>
            <VtsStatus :status="isReadOnly" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ t('bootable') }}
          </template>
          <template #value>
            <VtsStatus :status="isBootable" />
          </template>
        </VtsCardRowKeyValue>
      </template>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('change-block-tracking') }}
        </template>
        <template #value>
          <VtsStatus :status="isCbtEnabled" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('operation:snapshot') }}
        </template>
        <template #value>
          <VtsStatus :status="isSnapshottingEnabled" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script setup lang="ts">
import SrLink from '@/modules/storage-repository/components/SrLink.vue'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiFormatCardItem from '@/modules/vdi/components/list/panel/card-items/VdiFormatCardItem.vue'
import { useVdiConfiguration } from '@/modules/vdi/composables/use-vdi-configuration.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import VmLinkList from '@/modules/vm/components/VmLinkList.vue'
import { VDI_PAGE_CONTEXT, type VdiPageContext } from '@/shared/constants.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi, vbd, fromContext } = defineProps<{
  vdi: FrontXoVdi
  vbd?: FrontXoVbd
  fromContext: VdiPageContext
}>()

const { t } = useI18n()

const { sr, vms, isReadOnly, isBootable, isCbtEnabled, isSnapshottingEnabled } = useVdiConfiguration(
  () => vdi,
  () => vbd
)

const isFromSr = computed(() => fromContext === VDI_PAGE_CONTEXT.SR)

const isFromVm = computed(() => fromContext === VDI_PAGE_CONTEXT.VM)

const vmNames = computed(() => vms.value.map(vm => vm.name_label).join(', '))
</script>

<style scoped lang="postcss">
.vdi-configuration-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
