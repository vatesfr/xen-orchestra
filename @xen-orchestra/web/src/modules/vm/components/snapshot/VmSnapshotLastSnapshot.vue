<template>
  <UiCard>
    <UiCardTitle>{{ t('last-snapshot') }}</UiCardTitle>
    <VtsQuickInfoRow :label="t('snapshot')">
      <template #value>
        <UiLink size="medium" href="">{{ snapshot.name_label }}</UiLink>
      </template>
      <template #addons>
        <VtsCopyButton :value="snapshot.name_label" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('snapshot-created-on')" :value="formattedSnapshotDate" />
  </UiCard>
</template>

<script setup lang="ts">
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { XoVmSnapshot } from '@vates/types'
import { useDateFormat } from '@vueuse/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { snapshot } = defineProps<{
  snapshot: XoVmSnapshot
}>()

const { t } = useI18n()

// Duplicate code (VM snapshot last rever component) think to another way
const snapshotDate = computed(() => new Date(snapshot.snapshot_time * 1000))
const formattedSnapshotDate = useDateFormat(snapshotDate, 'YYYY-MM-DD HH:mm:ss')
</script>
