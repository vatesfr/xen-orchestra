<template>
  <div class="backup-job-form-checkbox">
    <UiCheckbox v-model="model" accent="brand" :disabled>
      {{ label }}
    </UiCheckbox>
    <UiInfo v-if="info" accent="info" wrap>
      {{ info }}
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'

defineProps<{
  label: string
  info?: string
  disabled?: boolean
}>()

const model = defineModel<boolean>({ required: true })
</script>

<style lang="postcss" scoped>
.backup-job-form-checkbox {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
