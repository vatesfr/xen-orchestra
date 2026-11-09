<template>
  <div class="assignments-table-layout">
    <UiTitle>
      {{ title }}
      <template #action>
        <UiButton
          left-icon="fa:plus"
          variant="secondary"
          accent="brand"
          size="medium"
          :disabled="!canAdd"
          :busy="isAdding"
          @click="emit('add')"
        >
          {{ t('action:add') }}
        </UiButton>
      </template>
    </UiTitle>
    <slot name="filter" />
    <div class="container">
      <UiTableActions :title="t('table-actions')">
        <DetachButton
          :disabled="!canDetach"
          :busy="isDetaching"
          :tooltip="detachErrorMessage ?? false"
          @click="emit('detach')"
        />
      </UiTableActions>
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import DetachButton from '@/shared/components/DetachButton.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  title: string
  canAdd: boolean
  isAdding: boolean
  canDetach: boolean
  isDetaching: boolean
  detachErrorMessage: string | undefined
}>()

const emit = defineEmits<{
  add: []
  detach: []
}>()

defineSlots<{
  default(): any
  filter(): any
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.assignments-table-layout,
.container {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}

.container {
  gap: 0.8rem;
}
</style>
