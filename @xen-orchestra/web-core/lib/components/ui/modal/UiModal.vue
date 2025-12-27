<!-- v2 -->
<template>
  <form :class="className" class="ui-modal" @click.self="emit('dismiss')">
    <div class="modal">
      <UiButtonIcon
        v-if="onDismiss"
        :accent="closeIconAccent"
        :target-scale="2"
        class="dismiss-button"
        icon="fa:xmark"
        size="small"
        @click="emit('dismiss')"
      />
      <main class="main">
        <VtsIcon v-if="icon" :name="icon" class="icon" size="current" />
        <div v-if="slots.title" class="typo-h4">
          <slot name="title" />
        </div>
        <div class="content">
          <slot name="content" />
        </div>
      </main>
      <VtsButtonGroup v-if="slots.buttons" class="buttons">
        <slot name="buttons" />
      </VtsButtonGroup>
    </div>
  </form>
</template>

<script lang="ts" setup>
import VtsButtonGroup from '@core/components/button-group/VtsButtonGroup.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import type { IconName } from '@core/icons'
import { useMapper } from '@core/packages/mapper'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

export type ModalAccent = 'info' | 'success' | 'warning' | 'danger'

const { accent } = defineProps<{
  accent: ModalAccent
  icon?: IconName
  onDismiss?: () => void
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const slots = defineSlots<{
  content(): any
  buttons?(): any
  title?(): any
}>()

const closeIconAccent = useMapper(
  () => accent,
  {
    info: 'brand',
    success: 'brand',
    warning: 'warning',
    danger: 'danger',
  },
  'info'
)

const className = computed(() => toVariants({ accent }))
</script>

<style lang="postcss" scoped>
.ui-modal {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;

  .modal {
    display: flex;
    flex-direction: column;
    min-width: min(40rem, calc(100% - 2rem));
    max-width: min(95vw, 120rem);
    max-height: min(90vh, 80rem);
    padding: 3.2rem 2.4rem 2.4rem;
    gap: 2.4rem;
    border-radius: 1rem;

    &:not(:has(.buttons)) {
      padding-bottom: 3.2rem;
    }

    .dismiss-button {
      position: absolute;
      top: 2.4rem;
      right: 2.4rem;
      z-index: 1;
    }

    &:not(:has(.icon)) .dismiss-button {
      top: 1rem;
      right: 1rem;
    }

    .main {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2.4rem;
      text-align: center;
      overflow: auto;

      .icon {
        font-size: 4.8rem;
      }

      .content {
        width: 100%;
      }
    }
  }

  &.accent--info {
    .modal {
      background-color: var(--color-info-background-selected);
    }

    .main .icon {
      color: var(--color-info-txt-base);
    }
  }

  &.accent--success {
    .modal {
      background-color: var(--color-success-background-selected);
    }

    .main .icon {
      color: var(--color-success-txt-base);
    }
  }

  &.accent--warning {
    .modal {
      background-color: var(--color-warning-background-selected);
    }

    .main .icon {
      color: var(--color-warning-txt-base);
    }
  }

  &.accent--danger {
    .modal {
      background-color: var(--color-danger-background-selected);
    }

    .main .icon {
      color: var(--color-danger-txt-base);
    }
  }
}
</style>
