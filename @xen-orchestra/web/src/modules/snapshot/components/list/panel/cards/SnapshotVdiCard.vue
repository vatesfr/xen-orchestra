<template>
  <UiCard v-if="vmSnapshotVdis.length > 0" class="card">
    <UiCardTitle>
      {{ t('vdis') }}
      <UiCounter :value="vmSnapshotVdis.length" accent="neutral" size="small" variant="primary" />
    </UiCardTitle>
    <div class="content">
      <div v-for="(vdi, index) in vmSnapshotVdis" :key="vdi.id" class="content">
        <UiLink icon="object:vdi" size="medium" href="">{{ vdi.name_label }}</UiLink>
        <!-- DESCRIPTION -->
        <VtsCardRowKeyValue truncate>
          <template #key>
            {{ t('description') }}
          </template>
          <template #value>{{ vdi.name_description }}</template>
          <template #addons>
            <VtsCopyButton :value="vdi.name_description" />
          </template>
        </VtsCardRowKeyValue>
        <!-- USED SPACE -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ t('used-space-on-sr') }}
          </template>
          <template #value>{{ formatSize(vdi.usage, 2) }}</template>
          <template #addons>
            <VtsCopyButton :value="formatSize(vdi.usage, 2)" />
          </template>
        </VtsCardRowKeyValue>
        <!-- FORMAT -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ t('format') }}
          </template>
          <template #value>{{ getVdiFormat(vdi.image_format) }}</template>
          <template #addons>
            <VtsCopyButton :value="getVdiFormat(vdi.image_format)" />
          </template>
        </VtsCardRowKeyValue>
        <VtsDivider v-if="index < vmSnapshotVdis.length - 1" type="stretch" />
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoVmSnapshotVdiCollection } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-vdi-collection.ts'
import { getVdiFormat } from '@/modules/vdi/utils/xo-vdi.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { formatSize } from '@core/utils/size.util.ts'
import type { XoVmSnapshot } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { snapshot } = defineProps<{ snapshot: XoVmSnapshot }>()
const { t } = useI18n()
const { vmSnapshotVdis } = useXoVmSnapshotVdiCollection({}, () => snapshot.id)
</script>

<style scoped lang="postcss">
.content {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
