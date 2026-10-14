<template>
  <UiCard>
    <UiTitle>
      {{ t('configuration') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('format')" :value="format" />
      <VtsTabularKeyValueRow v-if="isFromSr" :label="t('vms')">
        <template #value>
          <VmLinkList :vms />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow v-else :label="t('storage')">
        <template v-if="sr" #value>
          <SrLink :sr />
        </template>
      </VtsTabularKeyValueRow>
      <template v-if="isFromVm">
        <VtsTabularKeyValueRow :label="t('read-only')">
          <template #value>
            <VtsStatus :status="isReadOnly" />
          </template>
        </VtsTabularKeyValueRow>
        <VtsTabularKeyValueRow :label="t('bootable')">
          <template #value>
            <VtsStatus :status="isBootable" />
          </template>
        </VtsTabularKeyValueRow>
      </template>
      <template v-if="vdi">
        <VtsTabularKeyValueRow :label="t('change-block-tracking')">
          <template #value>
            <VtsStatus :status="isCbtEnabled" />
          </template>
        </VtsTabularKeyValueRow>
        <VtsTabularKeyValueRow :label="t('operation:snapshot')">
          <template #value>
            <VtsStatus :status="isSnapshottingEnabled" />
          </template>
        </VtsTabularKeyValueRow>
      </template>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import SrLink from '@/modules/storage-repository/components/SrLink.vue'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useVdiConfiguration } from '@/modules/vdi/composables/use-vdi-configuration.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import VmLinkList from '@/modules/vm/components/VmLinkList.vue'
import { VDI_PAGE_CONTEXT, type VdiPageContext } from '@/shared/constants.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi, vdiSnapshot, vbd, fromContext } = defineProps<{
  vdi?: FrontXoVdi
  vdiSnapshot?: FrontXoVdiSnapshot
  vbd?: FrontXoVbd
  fromContext?: VdiPageContext
}>()

const { t } = useI18n()

const { sr, vms, format, isReadOnly, isBootable, isCbtEnabled, isSnapshottingEnabled } = useVdiConfiguration(
  () => vdi ?? vdiSnapshot,
  () => vbd
)

const isFromSr = computed(() => fromContext === VDI_PAGE_CONTEXT.SR)

const isFromVm = computed(() => fromContext === VDI_PAGE_CONTEXT.VM)
</script>
