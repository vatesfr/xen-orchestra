<template>
  <!-- eslint-disable vue/no-v-html -->
  <div ref="rootElement" class="app-markdown" v-html="html" />
  <!-- eslint-enable vue/no-v-html -->
</template>

<script lang="ts" setup>
import markdown from '@/libs/markdown'
import { useEventListener } from '@vueuse/core'
import { computed, type Ref, ref } from 'vue'

const props = defineProps<{
  content: string
}>()

const rootElement = ref() as Ref<HTMLElement>

const html = computed(() => markdown.parse(props.content ?? ''))

useEventListener(
  rootElement,
  'click',
  (event: MouseEvent) => {
    const target = event.target as HTMLElement

    if (!target.classList.contains('copy-button')) {
      return
    }

    const copyable = target.parentElement!.querySelector<HTMLElement>('.copyable')

    if (copyable !== null) {
      navigator.clipboard.writeText(copyable.innerText)
    }
  },
  { capture: true }
)
</script>

<style lang="postcss" scoped>
.app-markdown {
  font-size: 1.6rem;

  :deep() {
    p,
    h1,
    h2,
    h3,
    h4,
    h5,
    h6,
    pre {
      margin: 1rem 0;
    }

    pre {
      width: 100%;
      padding: 0.8rem 1.4rem;
      border-radius: 1rem;
    }

    code:not(.hljs-code) {
      background-color: var(--color-normal-background-selected);
      padding: 0.3rem 0.6rem;
      border-radius: 0.6rem;
    }

    ul,
    ol {
      margin: revert;
      padding-left: 2rem;
      list-style-type: revert;
    }

    table {
      border-spacing: 0;

      th,
      td {
        padding: 0.5rem 1rem;
      }

      thead th {
        border-bottom: 2px solid var(--color-neutral-border);
        background-color: var(--color-neutral-background-secondary);
      }

      tbody td {
        border-bottom: 1px solid var(--color-neutral-border);
      }
    }

    .copy-button {
      font-size: 1.6rem;
      font-weight: 400;
      position: absolute;
      z-index: 1;
      right: 1rem;
      top: 0.4rem;
      cursor: pointer;
      color: white;
      border: none;
      background-color: transparent;

      &:hover {
        color: var(--color-normal-txt-base);
      }

      &:active {
        color: var(--color-normal-txt-hover);
      }
    }
  }
}
</style>
