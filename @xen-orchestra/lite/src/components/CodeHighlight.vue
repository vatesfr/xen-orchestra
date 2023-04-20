<template>
  <pre class="code-highlight hljs"><code v-html="codeAsHtml"></code></pre>
</template>

<script lang="ts" setup>
import HLJS from "highlight.js";
import { computed } from "vue";
import "highlight.js/styles/github-dark.css";

const props = withDefaults(
  defineProps<{
    code?: any;
    lang?: string;
  }>(),
  { lang: "typescript" }
);

const codeAsText = computed(() => {
  switch (typeof props.code) {
    case "string":
      return props.code;
    case "function":
      return String(props.code);
    default:
      return JSON.stringify(props.code, undefined, 2);
  }
});

const codeAsHtml = computed(
  () => HLJS.highlight(codeAsText.value, { language: props.lang }).value
);
</script>

<style lang="postcss" scoped>
.code-highlight {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  text-align: left;
  border-radius: 0.6rem;
}
</style>
