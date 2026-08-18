<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('space') }}
    </UiCardTitle>
    <div class="content">
      <VtsProgressBar
        no-ruler
        :current="vdi.physical_utilisation"
        :total="vdi.virtual_size"
        :label="vdi.name_label"
        legend-type="percent"
        class="progress"
      />
      <VtsCardRowKeyValue>
        <template #key>{{ t('used-space') }}</template>
        <template #value>{{ formattedUsedSpace }}</template>
        <template v-if="vdi.physical_utilisation > 0" #addons>
          <VtsCopyButton :value="String(vdi.physical_utilisation)" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('free-space') }}</template>
        <template #value>{{ formattedFreeSpace }}</template>
        <template v-if="freeSpace > 0" #addons>
          <VtsCopyButton :value="String(freeSpace)" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('size') }}</template>
        <template #value>{{ formattedTotalSize }}</template>
        <template v-if="vdi.virtual_size > 0" #addons>
          <VtsCopyButton :value="String(vdi.virtual_size)" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVdi } from '@/libs/xen-api/xen-api.types.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsProgressBar from '@core/components/progress-bar/VtsProgressBar.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSize } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi } = defineProps<{
  vdi: XenApiVdi
}>()

const { t } = useI18n()

const freeSpace = computed(() => vdi.virtual_size - vdi.physical_utilisation)

const formattedUsedSpace = computed(() => formatSize(vdi.physical_utilisation, 2))

const formattedFreeSpace = computed(() => formatSize(freeSpace.value, 2))

const formattedTotalSize = computed(() => formatSize(vdi.virtual_size, 2))
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .progress {
      margin-block-end: 1.6rem;
    }
  }
}
</style>
