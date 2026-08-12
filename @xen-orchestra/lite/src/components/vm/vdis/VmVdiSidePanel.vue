<template>
  <VtsSidePanel :has-selection="!!vdi" @close="emit('close')">
    <template v-if="vdi" #default>
      <!-- Info card -->
      <UiCard class="card">
        <VtsCardObjectTitle :id="vdi.uuid" :label="vdi.name_label" :icon="vdiIcon" />
        <div class="content">
          <VtsCardRowKeyValue>
            <template #key>{{ t('used-space') }}</template>
            <template #value>{{ formatSize(vdi.physical_utilisation, 2) }}</template>
            <template #addons>
              <VtsCopyButton :value="String(vdi.physical_utilisation)" />
            </template>
          </VtsCardRowKeyValue>
          <VtsCardRowKeyValue>
            <template #key>{{ t('free-space') }}</template>
            <template #value>{{ formatSize(freeSpace, 2) }}</template>
            <template #addons>
              <VtsCopyButton :value="String(freeSpace)" />
            </template>
          </VtsCardRowKeyValue>
          <VtsCardRowKeyValue>
            <template #key>{{ t('size') }}</template>
            <template #value>{{ formatSize(vdi.virtual_size, 2) }}</template>
            <template #addons>
              <VtsCopyButton :value="String(vdi.virtual_size)" />
            </template>
          </VtsCardRowKeyValue>
        </div>
      </UiCard>
      <!-- Space Card -->
      <UiCard class="card">
        <UiCardTitle>{{ t('space') }}</UiCardTitle>
        <div class="content">
          <VtsCardRowKeyValue>
            <template #key>{{ t('used-space') }}</template>
            <template #value>{{ formatSize(vdi.physical_utilisation, 0) }}</template>
            <template #addons>
              <VtsCopyButton :value="String(vdi.physical_utilisation)" />
            </template>
          </VtsCardRowKeyValue>
          <VtsCardRowKeyValue>
            <template #key>{{ t('size') }}</template>
            <template #value>{{ formatSize(vdi.virtual_size, 0) }}</template>
            <template #addons>
              <VtsCopyButton :value="String(vdi.virtual_size)" />
            </template>
          </VtsCardRowKeyValue>
        </div>
      </UiCard>
      <!-- Configuration Card -->
      <UiCard class="card">
        <UiCardTitle>{{ t('configuration') }}</UiCardTitle>
        <div class="content">
          <VtsCardRowKeyValue>
            <template #key>{{ t('format') }}</template>
            <template #value>{{ vdi.type }}</template>
          </VtsCardRowKeyValue>
          <VtsCardRowKeyValue>
            <template #key>{{ t('storage-repository') }}</template>
            <template #value>{{ sr?.name_label }}</template>
            <template v-if="sr?.name_label" #addons>
              <VtsCopyButton :value="sr.name_label" />
            </template>
          </VtsCardRowKeyValue>
          <VtsCardRowKeyValue>
            <template #key>{{ t('read-only') }}</template>
            <template #value>
              <VtsStatus :status="vdi.read_only" />
            </template>
          </VtsCardRowKeyValue>
        </div>
      </UiCard>
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import type { XenApiVdi, XenApiVbd } from '@/libs/xen-api/xen-api.types.ts'
import { useSrStore } from '@/stores/xen-api/sr.store'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardObjectTitle from '@core/components/card-object-title/VtsCardObjectTitle.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSize } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi, vbd } = defineProps<{
  vdi?: XenApiVdi
  vbd?: XenApiVbd
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const { getByOpaqueRef: getSrByOpaqueRef } = useSrStore().subscribe()

const sr = computed(() => (vdi !== undefined ? getSrByOpaqueRef(vdi.SR) : undefined))

const vdiIcon = computed(() => (vbd?.currently_attached ? 'object:vdi:attached' : 'object:vdi:detached'))

const freeSpace = computed(() => (sr.value ? sr.value.physical_size - sr.value.physical_utilisation : 0))
</script>

<style scoped lang="postcss">
.card {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
