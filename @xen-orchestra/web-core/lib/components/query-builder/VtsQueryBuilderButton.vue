<template>
  <UiButtonIcon
    v-if="small"
    v-tooltip="tooltip"
    icon="fa:filter"
    size="medium"
    accent="brand"
    :disabled
    @click="openModal()"
  />
  <UiButton v-else v-tooltip="tooltip" :disabled accent="brand" variant="tertiary" size="medium" @click="openModal()">
    {{ t('action:use-query-builder') }}
  </UiButton>
</template>

<script setup lang="ts">
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import type { QueryBuilderGroup } from '@core/packages/query-builder/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { disabled } = defineProps<{
  disabled?: boolean
  small?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const rootGroup = defineModel<QueryBuilderGroup>({ required: true })

const tooltip = computed(() => (disabled ? 'Current filter is invalid or too complex' : false))

const { t } = useI18n()

const { open } = useOverlay({
  component: () => import('@core/components/query-builder/VtsQueryBuilderModal.vue'),
  events: {
    'onUpdate:modelValue': newRootGroup => {
      rootGroup.value = newRootGroup

      return KEEP_OVERLAY_OPEN
    },
    onConfirm: () => emit('confirm'),
    onCancel: () => emit('cancel'),
  },
})

function openModal() {
  return open({ props: { modelValue: rootGroup.value } })
}
</script>
