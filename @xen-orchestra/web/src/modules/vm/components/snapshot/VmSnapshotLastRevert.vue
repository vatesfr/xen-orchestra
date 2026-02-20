<template>
  <UiCard>
    <UiCardTitle>{{ t('last-revert') }}</UiCardTitle>
    <div class="vm-snapshot-last-revert">
      <VtsQuickInfoRow :label="t('snapshot')" :value="snapshot.name_label">
        <template #value>
          <UiLink icon="object:vm-snapshot" size="medium" :href="xo5VmSnapshotHref">{{ snapshot.name_label }}</UiLink>
        </template>
      </VtsQuickInfoRow>
      <VtsCopyButton :value="snapshot.name_label" />
    </div>
    <VtsQuickInfoRow :label="t('snapshot-created-on')" :value="formattedDate" />
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { snapshot } = defineProps<{
  snapshot: FrontXoVmSnapshot
}>()

const { t, d } = useI18n()

const { buildXo5Route } = useXoRoutes()

const xo5VmSnapshotHref = computed(() => buildXo5Route(`/vms/${snapshot.id}/general`))

const formattedDate = computed(() =>
  d(snapshot.snapshot_time * 1000, { dateStyle: 'short', timeStyle: 'medium' }).replace(/\//g, '-')
)
</script>

<style lang="postcss" scoped>
.vm-snapshot-last-revert {
  display: flex;
  justify-content: space-between;
}
</style>
