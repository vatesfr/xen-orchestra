<template>
  <UiCard v-if="vmSnapshotVdis.length > 0" class="card-container">
    <UiCardTitle>
      {{ t('vdis') }}
      <UiCounter :value="vmSnapshotVdis.length" accent="neutral" size="small" variant="primary" />
    </UiCardTitle>
    <div class="content">
      <div v-for="(vmSnapshotVdi, index) in vmSnapshotVdis" :key="vmSnapshotVdi.id" class="content">
        <SnapshotVdiLinkCard :vdi="vmSnapshotVdi" :snapshot />
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
        <SnapshotVdiUsageCard :usage="vmSnapshotVdi.usage" />
        <!-- FORMAT -->
        <VdiFormatCard :format="vmSnapshotVdi.image_format" />
        <VtsDivider v-if="index < vmSnapshotVdis.length - 1" class="divider" type="stretch" />
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import SnapshotVdiLinkCard from '@/modules/snapshot/components/list/panel/cards/SnapshotVdiLinkCard.vue'
import SnapshotVdiUsageCard from '@/modules/snapshot/components/list/panel/cards/SnapshotVdiUsageCard.vue'
import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { useXoVmSnapshotVdiCollection } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-vdi-collection.ts'
import VdiFormatCard from '@/modules/vdi/components/list/panel/cards/VdiFormatCard.vue'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
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
