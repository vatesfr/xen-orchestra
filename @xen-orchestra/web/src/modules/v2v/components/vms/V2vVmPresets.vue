<template>
  <div class="v2v-vm-presets">
    <UiButton
      v-for="preset of presets"
      :key="preset.id"
      accent="brand"
      :variant="preset.isActive ? 'primary' : 'secondary'"
      size="small"
      @click="emit('apply', preset.id)"
    >
      {{ t('label-with-count', { label: preset.label, count: preset.count }) }}
    </UiButton>
  </div>
</template>

<script lang="ts" setup>
import type { V2vVmPreset } from '@/modules/v2v/composables/use-v2v-vms-step.composable.ts'
import type { V2vVmPresetId } from '@/modules/v2v/utils/v2v-vm-presets.util.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  presets: V2vVmPreset[]
}>()

const emit = defineEmits<{
  apply: [id: V2vVmPresetId]
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.v2v-vm-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}
</style>
