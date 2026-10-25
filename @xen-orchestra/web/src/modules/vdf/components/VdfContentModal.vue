<template>
  <UiModal
    :accent
    :class="`size--${size}`"
    class="vdf-content-modal"
    @confirm="emit('confirm')"
    @dismiss="emit('dismiss')"
  >
    <template #title>
      <slot name="title" />
    </template>
    <template #content>
      <div
        ref="body"
        :class="{ 'more-above': isMoreAbove, 'more-below': isMoreBelow }"
        class="body"
        @scroll="measure()"
      >
        <div ref="inner">
          <slot name="content" />
        </div>
      </div>
    </template>
    <template v-if="slots.buttons" #buttons>
      <slot name="buttons" />
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import UiModal, { type ModalAccent } from '@core/components/ui/modal/UiModal.vue'
import { useResizeObserver } from '@vueuse/core'
import { ref, useTemplateRef } from 'vue'

// A modal to read or fill in, as XO's query builder: no pictogram (those
// mark confirmations), a compact header, and one width per kind whatever
// the content. It grows with its content up to the viewport, then its
// body scrolls between a fixed header and fixed buttons, faded at the edge
// that has more.
const { size = 'large' } = defineProps<{
  accent: ModalAccent
  // large: reviews (changes, conflicts); medium: forms
  size?: 'medium' | 'large'
}>()

const emit = defineEmits<{
  confirm: []
  dismiss: []
}>()

const slots = defineSlots<{
  title(): any
  content(): any
  buttons?(): any
}>()

const body = useTemplateRef('body')

const isMoreAbove = ref(false)

const isMoreBelow = ref(false)

function measure() {
  const element = body.value

  if (element === null) {
    return
  }

  isMoreAbove.value = element.scrollTop > 1
  isMoreBelow.value = element.scrollTop + element.clientHeight < element.scrollHeight - 1
}

// the viewport, or the content, changes size
useResizeObserver([body, useTemplateRef('inner')], () => measure())
</script>

<style lang="postcss" scoped>
.vdf-content-modal.ui-modal {
  --vdf-modal-width: 80rem;

  &.size--medium {
    --vdf-modal-width: 56rem;
  }

  &:deep(.modal) {
    position: relative;
    width: min(var(--vdf-modal-width), calc(100vw - 3.2rem));
    max-height: calc(100dvh - 4.8rem);
    padding: 0;
    gap: 0;

    /* back in the header: without a pictogram, UiModal puts it in the corner */
    &:not(:has(.icon)) > .dismiss-button {
      top: 2.4rem;
      right: 2.4rem;
    }

    & > .main {
      flex: 1 1 auto;
      min-height: 0;
      align-items: stretch;
      gap: 0;
      text-align: start;
      overflow: hidden;

      & > .typo-h4 {
        padding: 2.4rem 6.4rem 1.6rem 2.4rem;
        border-block-end: 0.1rem solid var(--color-neutral-border);
      }

      & > .content {
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
    }

    & > .buttons {
      padding: 1.6rem 2.4rem;
      border-block-start: 0.1rem solid var(--color-neutral-border);
    }
  }

  .body {
    --fade-above: 0rem;
    --fade-below: 0rem;

    min-height: 0;
    padding: 2.4rem;
    overflow: auto;

    /* a line at the edge fades out rather than being cut */
    &.more-above,
    &.more-below {
      mask-image: linear-gradient(
        to bottom,
        transparent,
        #000 var(--fade-above),
        #000 calc(100% - var(--fade-below)),
        transparent
      );
    }

    &.more-above {
      --fade-above: 4rem;
    }

    &.more-below {
      --fade-below: 6.4rem;
    }
  }
}
</style>
