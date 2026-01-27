<template>
  <div class="ui-accordion-item">
    <div class="header">
      <span class="header-title">
        {{ title }}
      </span>
      <span class="header-icon">
        <UiButtonIcon
          v-tooltip="isExpanded ? t('action:close') : t('action:open')"
          class="toggle"
          accent="brand"
          :icon="isExpanded ? 'fa:angle-up' : 'fa:angle-down'"
          size="small"
          :target-scale="{ x: 1.5, y: 2 }"
          @click="emit('toggle')"
        />
      </span>
    </div>
    <VtsDivider v-if="isExpanded" type="stretch" />
    <span v-if="isExpanded">
      {{ text }}
    </span>
  </div>
</template>

<script setup lang="ts">
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import { useI18n } from 'vue-i18n'
import UiButtonIcon from '../button-icon/UiButtonIcon.vue'

export type accordionItemAccent = 'small' | 'large'

defineProps<{ title: string; text: string; accent: accordionItemAccent; disabled?: boolean; isExpanded?: boolean }>()

const emit = defineEmits<{
  toggle: []
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.ui-accordion-item {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  padding: 1.6rem;
  border: 0.1rem solid var(--color-neutral-border);
  border-radius: 0.4rem;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
