<template>
  <div class="backup-repository-form-checkbox">
    <UiCheckbox v-model="model" accent="brand">
      {{ label }}
    </UiCheckbox>
    <UiInfo v-if="warning !== undefined" accent="warning" wrap>
      {{ warning }}
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'

defineProps<{
  label: string
  warning?: string
}>()

const model = defineModel<boolean>({ required: true })
</script>

<style lang="postcss" scoped>
.backup-repository-form-checkbox {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
