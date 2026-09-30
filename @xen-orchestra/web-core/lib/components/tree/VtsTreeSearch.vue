<template>
  <div class="vts-tree-search">
    <UiInput
      ref="input"
      v-model="search"
      :aria-label="t('action:search-treeview')"
      right-icon="fa:magnifying-glass"
      :placeholder="t('action:search-treeview')"
      accent="brand"
      clearable
    />
  </div>
</template>

<script lang="ts" setup>
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const search = defineModel<string>({ default: '' })

const { t } = useI18n()

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
