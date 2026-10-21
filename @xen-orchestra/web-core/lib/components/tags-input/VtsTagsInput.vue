<template>
  <div class="vts-tags-input">
    <UiInput v-model="draft" :accent :placeholder @keydown="(event: KeyboardEvent) => handleKeydown(event)" />
    <div v-if="tags.length > 0" class="chips">
      <UiChip v-for="(tag, index) of tags" :key="index" accent="info" @remove="removeTag(index)">
        {{ tag }}
      </UiChip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import UiChip from '@core/components/ui/chip/UiChip.vue'
import UiInput, { type InputAccent } from '@core/components/ui/input/UiInput.vue'
import { ref } from 'vue'

const { accent, placeholder } = defineProps<{
  accent: InputAccent
  placeholder?: string
}>()

const tags = defineModel<string[]>({ required: true })

const draft = ref('')

const TAG_SEPARATOR_KEYS = ['Enter', ',']

// A pasted draft may hold several comma-separated tags
function addDraftTags() {
  const draftTags = new Set(draft.value.split(',').map(tag => tag.trim()))
  const newTags = [...draftTags].filter(tag => tag !== '' && !tags.value.includes(tag))

  draft.value = ''

  if (newTags.length === 0) {
    return
  }

  tags.value = [...tags.value, ...newTags]
}

function handleKeydown(event: KeyboardEvent) {
  // Enter also validates an IME composition, which must not add a half-typed tag
  const isSeparator = !event.isComposing && TAG_SEPARATOR_KEYS.includes(event.key)

  if (!isSeparator) {
    return
  }

  // Prevents a form submit on Enter and keeps the comma out of the draft
  event.preventDefault()
  addDraftTags()
}

function removeTag(index: number) {
  tags.value = tags.value.filter((_tag, tagIndex) => tagIndex !== index)
}
</script>

<style lang="postcss" scoped>
.vts-tags-input {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
}
</style>
