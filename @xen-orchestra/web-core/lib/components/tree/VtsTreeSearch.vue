<template>
  <div class="vts-tree-search">
    <UiInput
      ref="input"
      v-model="search"
      :aria-label="label"
      right-icon="fa:magnifying-glass"
      :placeholder="label"
      :aria-keyshortcuts="TREE_SEARCH_ARIA_KEY_SHORTCUTS"
      accent="brand"
      clearable
    />
  </div>
</template>

<script lang="ts" setup>
import UiInput from '@core/components/ui/input/UiInput.vue'
import {
  TREE_SEARCH_ARIA_KEY_SHORTCUTS,
  TREE_SEARCH_SHORTCUT_LABEL,
} from '@core/composables/tree-search-shortcut.composable.ts'
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const search = defineModel<string>({ default: '' })

const { t } = useI18n()

const label = computed(() => t('action:search-treeview', { shortcut: TREE_SEARCH_SHORTCUT_LABEL }))

const input = useTemplateRef('input')

function focus() {
  input.value?.focus()
}

defineExpose({ focus })
</script>

<style lang="postcss" scoped>
.vts-tree-search {
  padding: 0.4rem;
}
</style>
