<template>
  <UiCardTitle v-if="datastoreSummary">
    {{ t('all-vms') }}
    <UiChip accent="info" @remove="emit('removeDatastore')">{{ datastoreSummary.chipLabel }}</UiChip>
    <template #info>
      <UiButton accent="brand" variant="tertiary" size="small" @click="emit('clearFilter')">
        {{ t('action:clear-filter') }}
      </UiButton>
    </template>
    <template #description>
      <VtsInlineParts>
        <span v-for="label of datastoreSummary.summaryLabels" :key="label">{{ label }}</span>
      </VtsInlineParts>
    </template>
  </UiCardTitle>
  <UiCardTitle v-else>
    {{ t('all-vms') }}
    <template #description>
      <VtsInlineParts>
        <span v-if="sourceHost">{{ sourceHost }}</span>
        <span>{{ t('v2v:filter-vms-info') }}</span>
      </VtsInlineParts>
    </template>
  </UiCardTitle>
</template>

<script lang="ts" setup>
import type { V2vDatastoreSummary } from '@/modules/v2v/composables/use-v2v-vms-step.composable.ts'
import VtsInlineParts from '@core/components/inline-parts/VtsInlineParts.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiChip from '@core/components/ui/chip/UiChip.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  sourceHost?: string
  datastoreSummary?: V2vDatastoreSummary
}>()

const emit = defineEmits<{
  removeDatastore: []
  clearFilter: []
}>()

const { t } = useI18n()
</script>
