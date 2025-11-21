<template>
  <UiCard class="card-container">
    <div class="vdi-label typo-body-bold">
      <VtsIcon size="medium" name="fa:hard-drive" />
      {{ vdi.name_label }}
    </div>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('uuid') }}</template>
        <template #value>
          {{ vdi.uuid }}
        </template>
        <template v-if="vdi.uuid" #addons>
          <VtsCopyButton :value="vdi.uuid" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('description') }}</template>
        <template #value>{{ vdi.name_description }}</template>
        <template v-if="vdi.name_description" #addons>
          <VtsCopyButton :value="vdi.name_description" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('tags') }}</template>
        <template #value>
          <UiTagsList v-if="vdi.tags.length > 0">
            <UiTag v-for="(tag, index) in vdi.tags" :key="index" accent="info" variant="secondary">
              {{ tag }}
            </UiTag>
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
        <template v-if="vbdsStatus" #addons>
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
import { useXoVbdCollection } from '@/remote-resources/use-xo-vbd-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import type { XoVdi, XoVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi, vm } = defineProps<{
  vdi: XoVdi
  vm: XoVm
}>()

const { vbds } = useXoVbdCollection()

const { t } = useI18n()

const vbdsStatus = computed(() => {
  if (vdi.$VBDs.length === 0) {
    return 'disconnected'
  }

  const vdiVbds = vbds.value.filter(vbd => vdi.$VBDs.includes(vbd.id))
  if (vdiVbds.length === 0) {
    return 'disconnected'
  }
  const isAttached = vdiVbds.map(vbd => vbd.attached)

  if (isAttached.every(Boolean)) {
    return 'connected'
  }
  if (isAttached.some(Boolean)) {
    return 'partially-connected'
  }
  return 'disconnected'
})
const vmVbds = computed(() => {
  if (!vm.$VBDs) {
    return undefined
  }

  return vbds.value.filter(vbd => vm.$VBDs.includes(vbd.id) && !vbd.is_cd_drive)
})

const vdiDevice = computed(() => vmVbds.value?.find(vbd => vbd.VDI === vdi.id)?.device)
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .vdi-label {
    display: flex;
    gap: 0.8rem;
    align-items: center;
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
