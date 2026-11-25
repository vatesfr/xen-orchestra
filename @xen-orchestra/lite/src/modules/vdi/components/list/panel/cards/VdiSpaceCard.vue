<template>
  <UiPanelCard>
    <UiPanelCardTitle size="medium" :label="t('space')" />
    <VtsCardRowList>
      <VtsCardRowKeyValue>
        <template #key>{{ t('used-space') }}</template>
        <template #value>{{ usedSpace }}</template>
        <template v-if="chainPhysicalUsage > 0" #addons>
          <VtsCopyButton :value="usedSpace" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('size') }}</template>
        <template #value>{{ size }}</template>
        <template v-if="vdi.virtual_size > 0" #addons>
          <VtsCopyButton :value="size" />
        </template>
      </VtsCardRowKeyValue>
    </VtsCardRowList>
  </UiPanelCard>
</template>

<script setup lang="ts">
import type { XenApiVdi } from '@/libs/xen-api/xen-api.types.ts'
import { useVdiStore } from '@/stores/xen-api/vdi.store.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { formatSize } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi } = defineProps<{
  vdi: XenApiVdi
}>()

const { t } = useI18n()

const { getChainPhysicalUsage } = useVdiStore().subscribe()

const chainPhysicalUsage = computed(() => getChainPhysicalUsage(vdi))

const usedSpace = computed(() => formatSize(chainPhysicalUsage.value, 2))

const size = computed(() => formatSize(vdi.virtual_size, 2))
</script>
