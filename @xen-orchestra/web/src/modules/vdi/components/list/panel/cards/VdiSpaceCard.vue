<template>
  <UiPanelCard>
    <UiPanelCardTitle size="medium" :label="t('space')" />
    <VtsCardRowList>
      <VtsCardRowKeyValue>
        <template #key>{{ t('used-space') }}</template>
        <template #value>{{ usedSpace }}</template>
        <template v-if="vdi.chainPhysicalUsage > 0" #addons>
          <VtsCopyButton :value="usedSpace" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('size') }}</template>
        <template #value>{{ size }}</template>
        <template v-if="vdi.size > 0" #addons>
          <VtsCopyButton :value="size" />
        </template>
      </VtsCardRowKeyValue>
    </VtsCardRowList>
  </UiPanelCard>
</template>

<script setup lang="ts">
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { formatSize } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi } = defineProps<{
  vdi: FrontXoVdi
}>()

const { t } = useI18n()

const usedSpace = computed(() => formatSize(vdi.chainPhysicalUsage, 2))

const size = computed(() => formatSize(vdi.size, 2))
</script>
