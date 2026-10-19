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
      <InlineParts>
        <span v-for="label of datastoreSummary.summaryLabels" :key="label">{{ label }}</span>
      </InlineParts>
    </template>
  </UiCardTitle>
  <UiCardTitle v-else>
    {{ t('all-vms') }}
    <template #description>
      <InlineParts>
        <span v-if="sourceHost">{{ sourceHost }}</span>
        <span>{{ t('v2v:filter-vms-info') }}</span>
      </InlineParts>
    </template>
  </UiCardTitle>
</template>

<script lang="ts" setup>
import type { V2vDatastoreSummary } from '@/modules/v2v/composables/use-v2v-vms-step.composable.ts'
import InlineParts from '@/shared/components/InlineParts.vue'
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
