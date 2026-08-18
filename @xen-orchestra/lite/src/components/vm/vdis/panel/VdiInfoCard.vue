<template>
  <UiCard class="card-container">
    <VtsCardObjectTitle :id="vdi.uuid" :label="vdi.name_label" :icon="vdiIcon" />
    <div class="content">
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('description') }}</template>
        <template #value>{{ vdi.name_description ?? '-' }}</template>
        <template v-if="vdi.name_description" #addons>
          <VtsCopyButton :value="vdi.name_description" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue align-top>
        <template #key>{{ t('tags') }}</template>
        <template #value>
          <UiTagsList v-if="vdiTags.length">
            <VtsTag v-for="tag in vdiTags" :key="tag" :value="tag" />
          </UiTagsList>
          <span v-else class="value" />
        </template>
        <template v-if="vdiTags.length" #addons>
          <VtsCopyButton :value="vdiTags.join(', ')" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('status') }}</template>
        <template #value>
          <VtsStatus :status="attachmentStatus" />
        </template>
        <template #addons>
          <VtsCopyButton :value="attachmentStatus" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="vbd?.device">
        <template #key>{{ t('device') }}</template>
        <template #value>{{ vbd.device }}</template>
        <template #addons>
          <VtsCopyButton :value="vbd.device" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { getVbdsForVdi, getVdiIcon } from '@/libs/vdi.ts'
import type { XenApiVdi, XenApiVbd } from '@/libs/xen-api/xen-api.types.ts'
import { useVbdStore } from '@/stores/xen-api/vbd.store'
import type { IconName } from '@core/icons'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardObjectTitle from '@core/components/card-object-title/VtsCardObjectTitle.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { CONNECTION_STATUS } from '@core/types/connection.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi, vbd } = defineProps<{
  vdi: XenApiVdi
  vbd?: XenApiVbd
}>()

const { t } = useI18n()

const { getByOpaqueRef: getVbdByOpaqueRef } = useVbdStore().subscribe()

const vdiTags = computed(() => vdi?.tags ?? [])

const vdiVbds = computed(() => getVbdsForVdi(vdi, getVbdByOpaqueRef))

const attachmentStatus = computed(() => {
  const attached = vdiVbds.value.filter(v => v.currently_attached).length
  const total = vdiVbds.value.length

  if (total === 0 || attached === 0) return CONNECTION_STATUS.DISCONNECTED
  if (attached === total) return CONNECTION_STATUS.CONNECTED
  return CONNECTION_STATUS.PARTIALLY_CONNECTED
})

const vdiIcon = computed<IconName>(() => getVdiIcon(vdiVbds.value))
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .value:empty::before {
    content: '-';
  }
}
</style>
