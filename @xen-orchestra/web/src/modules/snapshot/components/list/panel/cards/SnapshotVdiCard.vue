<template>
  <UiCard v-if="vmSnapshotVdis.length > 0" class="card-container">
    <UiCardTitle>
      {{ t('vdis') }}
      <UiCounter :value="vmSnapshotVdis.length" accent="neutral" size="small" variant="primary" />
    </UiCardTitle>
    <div class="content">
      <div v-for="(vmSnapshotVdi, index) in vmSnapshotVdis" :key="vmSnapshotVdi.id" class="content">
        <SnapshotVdiCardItem :vdi="vmSnapshotVdi" :snapshot />
        <!-- DESCRIPTION -->
        <VtsCardRowKeyValue truncate>
          <template #key>
            {{ t('description') }}
          </template>
          <template #value>{{ vmSnapshotVdi.name_description }}</template>
          <template v-if="vmSnapshotVdi.name_description" #addons>
            <VtsCopyButton :value="vmSnapshotVdi.name_description" />
          </template>
        </VtsCardRowKeyValue>
        <!-- USED SPACE -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ t('used-space-on-sr') }}
          </template>
          <template #value>{{ formatSize(vmSnapshotVdi.usage, 2) }}</template>
          <template v-if="vmSnapshotVdi.usage" #addons>
            <VtsCopyButton :value="formatSize(vmSnapshotVdi.usage, 2)" />
          </template>
        </VtsCardRowKeyValue>
        <!-- FORMAT -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ t('format') }}
          </template>
          <template #value>{{ getVdiFormat(vmSnapshotVdi.image_format) }}</template>
          <template v-if="vmSnapshotVdi.image_format" #addons>
            <VtsCopyButton :value="getVdiFormat(vmSnapshotVdi.image_format)" />
          </template>
        </VtsCardRowKeyValue>
        <VtsDivider v-if="index < vmSnapshotVdis.length - 1" class="divider" type="stretch" />
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import SnapshotVdiCardItem from '@/modules/snapshot/components/list/panel/card-items/SnapshotVdiCardItem.vue'
import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { useXoVmSnapshotVdiCollection } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-vdi-collection.ts'
import { getVdiFormat } from '@/modules/vdi/utils/xo-vdi.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { formatSize } from '@core/utils/size.util.ts'
import { useI18n } from 'vue-i18n'

const { snapshot } = defineProps<{ snapshot: FrontXoVmSnapshot }>()

const { t } = useI18n()

const { vmSnapshotVdis } = useXoVmSnapshotVdiCollection({}, () => snapshot.id)
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .divider {
      margin-block: 1.6rem;
    }
  }
}
</style>
