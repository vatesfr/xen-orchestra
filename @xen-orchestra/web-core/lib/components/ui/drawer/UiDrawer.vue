<!-- v1 -->
<template>
  <Transition name="drawer">
    <form v-if="isOpen" class="ui-drawer" @click.self="emit('dismiss')" @submit="emit('submit', $event)">
      <aside class="drawer">
        <div class="header">
          <div class="typo-h4">
            <slot name="title" />
          </div>
          <UiButtonIcon
            v-if="onDismiss"
            :target-scale="2"
            class="dismiss-button"
            icon="action:close-cancel-clear"
            accent="brand"
            size="small"
            @click="emit('dismiss')"
          />
        </div>
        <div class="content">
          <slot name="content" />
        </div>
        <div v-if="slots.buttons" class="buttons">
          <slot name="buttons" />
        </div>
      </aside>
    </form>
  </Transition>
</template>

<script lang="ts" setup>
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'

defineProps<{
  isOpen: boolean
  onDismiss?: () => void
}>()

const emit = defineEmits<{
  dismiss: []
  submit: [event: SubmitEvent]
}>()

const slots = defineSlots<{
  title?(): any
  content(): any
  buttons?(): any
}>()
</script>

<style lang="postcss" scoped>
/* Slide-in from right */
.drawer-enter-active.ui-drawer,
.drawer-leave-active.ui-drawer {
  transition: opacity 0.3s ease;
}

.drawer-enter-active .drawer,
.drawer-leave-active .drawer {
  transition: transform 0.3s ease;
}

.drawer-enter-from.ui-drawer,
.drawer-leave-to.ui-drawer {
  opacity: 0;
}

.drawer-enter-from .drawer,
.drawer-leave-to .drawer {
  transform: translateX(100%);

  &:dir(rtl) {
    transform: translateX(-100%);
  }
}

.ui-drawer {
  position: fixed;
  display: flex;
  inset: 0;
  z-index: 1020;
  justify-content: flex-end;
  align-items: stretch;
  background-color: rgba(0, 0, 0, 0.5);

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
      border-bottom: 0.1rem solid var(--color-neutral-border);
    }

    .content {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      overflow: auto;
      flex: 1;
      margin: 0 0.5rem;
      padding: 2.5rem;
    }

    &:not(:has(.buttons)) {
      padding-bottom: 3.2rem;
    }

    .buttons {
      margin-top: auto;
      padding: 1.6rem;
      background-color: var(--color-neutral-background-primary);
      border-top: 0.1rem solid var(--color-neutral-border);
    }

    @media (min-width: 1023px) {
      min-width: 50%;
      border-inline-start: 0.1rem solid var(--color-neutral-border);
    }
  }
}
</style>
