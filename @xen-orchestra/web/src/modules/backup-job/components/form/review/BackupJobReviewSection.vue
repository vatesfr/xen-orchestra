<template>
  <div class="backup-job-review-section">
    <UiTitle>
      {{ title }}
      <template #action>
        <UiButton variant="tertiary" accent="brand" size="medium" left-icon="action:edit" @click="emit('edit')">
          {{ t('action:edit') }}
        </UiButton>
      </template>
    </UiTitle>
    <UiInfo v-if="hasError" accent="danger" wrap>{{ t('step-contains-errors') }}</UiInfo>
    <slot />
  </div>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  title: string
  hasError?: boolean
}>()

const emit = defineEmits<{
  edit: []
}>()

defineSlots<{
  default(): any
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.backup-job-review-section {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
