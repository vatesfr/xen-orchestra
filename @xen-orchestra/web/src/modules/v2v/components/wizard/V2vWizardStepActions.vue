<template>
  <div class="v2v-wizard-step-actions">
    <UiButton accent="brand" variant="secondary" size="medium" @click="emit('back')">
      {{ t('action:back') }}
    </UiButton>
    <slot />
  </div>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  back: []
}>()

defineSlots<{
  default(): any
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.v2v-wizard-step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
}
</style>
