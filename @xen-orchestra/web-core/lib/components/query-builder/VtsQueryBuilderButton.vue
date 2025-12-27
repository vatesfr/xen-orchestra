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
  <UiButton v-else v-tooltip="tooltip" :disabled accent="brand" variant="secondary" size="medium" @click="openModal()">
    {{ t('action:use-query-builder') }}
  </UiButton>
</template>

<script setup lang="ts">
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useModal } from '@core/packages/modal/use-modal'
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

const openModal = useModal(() => ({
  component: import('@core/components/query-builder/VtsQueryBuilderModal.vue'),
  props: {
    title: t('query-builder'),
    modelValue: rootGroup,
    'onUpdate:modelValue': (newRootGroup: QueryBuilderGroup) => {
      rootGroup.value = newRootGroup
    },
  },
  onConfirm: () => emit('confirm'),
  onCancel: () => emit('cancel'),
}))
</script>
