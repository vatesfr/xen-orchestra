<!-- v5 -->
<!-- TODO Pinning behaviour waiting for design clarifications -->
<template>
  <div class="ui-panel" :class="{ error, 'mobile-drawer': uiStore.isSmall }">
    <div v-if="slots.header || closable" class="header">
      <slot v-if="slots.header" name="header" />
      <div v-if="closable" class="built-in-buttons">
        <UiButtonIcon
          v-if="closable"
          v-tooltip="t('action:close')"
          size="small"
          variant="tertiary"
          accent="brand"
          :icon="uiStore.isSmall ? 'fa:angle-left' : 'action:close-cancel-clear'"
          @click="emit('close')"
        />
      </div>
    </div>
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '@core/stores/ui.store'
import { useI18n } from 'vue-i18n'
import UiButtonIcon from '../button-icon/UiButtonIcon.vue'

defineProps<{
  error?: boolean
  closable?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const slots = defineSlots<{
  default(): any
  header?(): any
}>()

const uiStore = useUiStore()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.ui-panel {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  border-inline-start: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-secondary);

  &:not(.mobile-drawer) {
    min-height: calc(100dvh - 16rem);
  }

  .header {
    border-bottom: 0.1rem solid var(--color-neutral-border);
    background-color: var(--color-neutral-background-primary);
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1.6rem;
    padding: 0.4rem 1.6rem;
  }

  .content {
    display: flex;
    flex-direction: column;
    padding: 0.8rem;
    gap: 0.8rem;
  }

  &.mobile-drawer {
    .header {
      .built-in-buttons {
        order: -1;
      }
    }
    .content {
      overflow: auto;
    }
  }

  &.error {
    background-color: var(--color-danger-background-selected);

    .content {
      padding-top: 15rem;
    }
  }
}
</style>
