<template>
  <div class="vm-migrate-mapping-toolbar">
    <VmMigrateFormSelect :id :label class="select" />
    <div class="actions">
      <UiButton
        v-tooltip="fillTooltip"
        accent="brand"
        size="medium"
        variant="primary"
        :disabled="fillDisabled"
        @click="emit('fill')"
      >
        {{ fillLabel }}
      </UiButton>
      <VtsDivider type="stretch" />
      <UiButton accent="brand" size="medium" variant="secondary" @click="emit('reset')">
        {{ resetLabel }}
      </UiButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import VmMigrateFormSelect from '@/modules/vm/components/form/migrate/VmMigrateFormSelect.vue'
import type { FormSelectId } from '@core/packages/form-select'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'

const { fillDisabled, fillDisabledTooltip } = defineProps<{
  id: FormSelectId
  label: string
  fillLabel: string
  resetLabel: string
  fillDisabled?: boolean
  fillDisabledTooltip?: string
}>()

const emit = defineEmits<{
  fill: []
  reset: []
}>()

const fillTooltip = computed(() => {
  if (fillDisabled && fillDisabledTooltip !== undefined) {
    return fillDisabledTooltip
  }

  return false
})
</script>

<style lang="postcss" scoped>
.vm-migrate-mapping-toolbar {
  display: flex;
  align-items: flex-end;
  gap: 1.6rem;

  .select {
    flex: 0 1 44.2rem;
    min-width: 0;
  }

  .actions {
    display: flex;
    gap: 1.6rem;
  }
}
</style>
