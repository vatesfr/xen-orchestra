<template>
  <Transition name="drawer">
    <form v-if="isOpen" class="ui-drawer" @submit="handleSubmit">
      <aside class="drawer">
        <div class="header">
          <div class="typo-h4">
            <slot name="title" />
          </div>
          <UiButtonIcon
            v-if="onCancel"
            :target-scale="2"
            class="dismiss-button"
            icon="fa:xmark"
            accent="brand"
            size="small"
            @click="handleCancel"
          />
        </div>
        <div class="content">
          <slot name="content" />
        </div>
        <VtsButtonGroup v-if="slots.buttons" class="buttons">
          <UiButton v-if="onCancel" variant="secondary" accent="brand" size="medium" @click="handleCancel">
            {{ labelCancel ?? t('cancel') }}
          </UiButton>
          <UiButton variant="primary" accent="brand" size="medium" @click="handleSubmit">
            {{ labelConfirm ?? t('action:continue') }}
          </UiButton>
        </VtsButtonGroup>
      </aside>
    </form>
  </Transition>
</template>

<script lang="ts" setup>
import VtsButtonGroup from '@core/components/button-group/VtsButtonGroup.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { useMagicKeys, whenever } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

const { isOpen, onConfirm, onCancel, labelConfirm, labelCancel } = defineProps<{
  isOpen: boolean
  onConfirm: () => void
  onCancel?: () => void
  labelConfirm?: string
  labelCancel?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const slots = defineSlots<{
  title(): any
  content(): any
  buttons?(): any
}>()

const { t } = useI18n()

function handleCancel() {
  emit('cancel')

  if (!onCancel) {
    return
  }

  return onCancel()
}

function handleSubmit(event: SubmitEvent) {
  event.preventDefault()
  emit('confirm')

  if (!onConfirm) {
    return undefined
  }

  return onConfirm()
}

const { escape } = useMagicKeys()

whenever(escape, () => {
  if (!isOpen) {
    return
  }

  return handleCancel()
})
</script>

<style lang="postcss" scoped>
/* Animation slide-in depuis la droite */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s ease;
}

.drawer-enter-active .drawer,
.drawer-leave-active .drawer {
  transition: transform 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .drawer,
.drawer-leave-to .drawer {
  transform: translateX(100%);
}

.ui-drawer {
  width: 100vw;
  position: fixed;
  display: flex;
  left: 0;
  top: 0;
  inset: 0;
  bottom: 0;
  right: 0;
  z-index: 1020;
  justify-content: flex-end;
  align-items: stretch;
  background-color: rgba(0, 0, 0, 0.5);

  .drawer {
    display: flex;
    flex-direction: column;
    min-width: 100%;
    max-width: 100%;
    min-height: 100vh;
    background-color: var(--color-neutral-background-secondary);

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.6rem;
      background-color: var(--color-neutral-background-primary);
      border-bottom: 1px solid var(--color-neutral-border);
      position: relative;
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
      border-top: 1px solid var(--color-neutral-border);
    }

    @media (min-width: 1023px) {
      min-width: 50%;
      border-left: 1px solid var(--color-neutral-border);
    }
  }
}
</style>
