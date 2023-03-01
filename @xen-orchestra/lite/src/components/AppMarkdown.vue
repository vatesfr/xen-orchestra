<template>
  <div ref="rootElement" class="app-markdown" v-html="html" />
</template>

<script lang="ts" setup>
import { type Ref, computed, ref } from "vue";
import { useEventListener } from "@vueuse/core";
import "highlight.js/styles/github-dark.css";
import { markdown } from "@/libs/markdown";

const rootElement = ref() as Ref<HTMLElement>;

const props = defineProps<{
  content: string;
}>();

const html = computed(() => markdown.render(props.content ?? ""));

useEventListener(
  rootElement,
  "click",
  (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    if (!target.classList.contains("copy-button")) {
      return;
    }

    const copyable =
      target.parentElement!.querySelector<HTMLElement>(".copyable");

    if (copyable !== null) {
      navigator.clipboard.writeText(copyable.innerText);
    }
  },
  { capture: true }
);
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
      background-color: var(--background-color-extra-blue);
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
        border-bottom: 2px solid var(--color-blue-scale-400);
        background-color: var(--background-color-secondary);
      }

      tbody td {
        border-bottom: 1px solid var(--color-blue-scale-400);
      }
    }

    .copy-button {
      font-size: 1.6rem;
      font-weight: 400;
      position: absolute;
      z-index: 1;
      right: 1rem;
      cursor: pointer;
      color: white;
      border: none;
      background-color: transparent;

      &:hover {
        color: var(--color-extra-blue-base);
      }

      &:active {
        color: var(--color-extra-blue-d20);
      }
    }
  }
}
</style>
