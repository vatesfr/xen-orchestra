<template>
  <form class="ui-drawer" aria-modal="true" role="dialog" @click.self="emit('dismiss')">
    <aside class="drawer">
      <div class="header">
        <div v-if="slots.title || title !== undefined" class="typo-h4">
          <slot name="title">
            {{ title }}
          </slot>
        </div>
        <UiButtonIcon
          :target-scale="2"
          icon="action:close-cancel-clear"
          accent="brand"
          size="small"
          @click="emit('dismiss')"
        />
      </div>
      <div class="content">
        <slot name="content" />
      </div>
      <VtsButtonGroup v-if="slots.buttons" no-stack class="buttons">
        <slot name="buttons" />
      </VtsButtonGroup>
    </aside>
  </form>
</template>

<script lang="ts" setup>
import VtsButtonGroup from '@core/components/button-group/VtsButtonGroup.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'

defineProps<{
  title?: string
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const slots = defineSlots<{
  content(): any
  title?(): any
  buttons?(): any
}>()
</script>

<style lang="postcss" scoped>
.ui-drawer {
  position: fixed;
  display: flex;
  inset: 0;
  justify-content: flex-end;
  align-items: stretch;

  .drawer {
    display: flex;
    flex-direction: column;
    min-width: 100%;
    max-width: 100%;
    min-height: 100dvh;
    background-color: var(--color-neutral-background-secondary);

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.6rem;
      background-color: var(--color-neutral-background-primary);
      border-block-end: 0.1rem solid var(--color-neutral-border);
    }

    .content {
      overflow: auto;
      flex: 1;
      padding: 2.4rem;
    }

    .buttons {
      margin-block-start: auto;
      padding: 1.6rem;
      background-color: var(--color-neutral-background-primary);
      border-block-start: 0.1rem solid var(--color-neutral-border);
    }

    @media (--medium-or-large) {
      min-width: 50%;
      max-width: 50%;
      border-inline-start: 0.1rem solid var(--color-neutral-border);
    }
  }
}
</style>
