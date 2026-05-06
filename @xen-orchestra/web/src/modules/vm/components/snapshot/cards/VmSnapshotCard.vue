<template>
  <UiCard class="vm-snapshot-card">
    <UiCardTitle>{{ title }}</UiCardTitle>
    <VtsKeyValueList class="snapshot-row-container">
      <VtsKeyValueRow :label="t('snapshot')" class="snapshot-row">
        <template #value>
          <UiLink
            v-if="snapshot?.name_label"
            icon="object:vm-snapshot"
            size="medium"
            :href="buildXo5VmSnapshotRoute(snapshot?.$snapshot_of, snapshot?.id)"
          >
            {{ snapshot.name_label }}
          </UiLink>
        </template>
      </VtsKeyValueRow>
      <VtsCopyButton v-if="snapshot?.name_label" :value="snapshot.name_label" class="copy-button" />
      <VtsKeyValueRow :label="t('snapshot-created-on')">
        <template #value>
          <span v-if="formattedDate">{{ formattedDate }}</span>
        </template>
      </VtsKeyValueRow>
    </VtsKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { useXo5VmSnapshotRoute } from '@/modules/snapshot/composables/xo-vm-snapshot-route-xo5.composable.ts'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsKeyValueList from '@core/components/key-value-list/VtsKeyValueList.vue'
import VtsKeyValueRow from '@core/components/key-value-row/VtsKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { snapshot } = defineProps<{
  snapshot: FrontXoVmSnapshot | undefined
  title: string
}>()

const { t, d } = useI18n()

const formattedDate = computed(() =>
  snapshot ? d(snapshot.snapshot_time * 1000, { dateStyle: 'short', timeStyle: 'medium' }) : undefined
)

const { buildXo5VmSnapshotRoute } = useXo5VmSnapshotRoute()
</script>

<style lang="postcss" scoped>
.vm-snapshot-card {
  .snapshot-row-container {
    position: relative;

    .snapshot-row {
      padding-inline-end: 2.5rem;
    }

    .copy-button {
      position: absolute;
      inset-block-start: -0.2rem;
      inset-inline-end: 0;
    }
  }
}
</style>
