<template>
  <!-- eslint-disable vue/no-v-html -->
  <pre class="code-highlight hljs"><code v-html="codeAsHtml" /></pre>
  <!-- eslint-enable vue/no-v-html -->
</template>

<script lang="ts" setup>
import { type AcceptedLanguage, highlight } from '@/libs/highlight'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    code?: any
    lang?: AcceptedLanguage
  }>(),
  { lang: 'typescript' }
)

const codeAsText = computed(() => {
  switch (typeof props.code) {
    case 'string':
      return props.code
    case 'function':
      return String(props.code)
    default:
      return JSON.stringify(props.code, undefined, 2)
  }
})

const codeAsHtml = computed(() => highlight(codeAsText.value, { language: props.lang }).value)
</script>

<style lang="postcss" scoped>
.code-highlight {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  text-align: left;
  border-radius: 0.6rem;
}
</style>
