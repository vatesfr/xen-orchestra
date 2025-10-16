<template>
  <div class="sidebar-search">
    <UiInput
      v-model="search"
      :aria-label="t('sidebar.search-tree-view')"
      :icon="!isSearching ? 'fa:magnifying-glass' : undefined"
      :placeholder="t('sidebar.search-tree-view')"
      accent="brand"
      clearable
      :is-searching
    />
  </div>
</template>

<script lang="ts" setup>
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useI18n } from 'vue-i18n'

defineProps<{ isSearching?: boolean }>()

const search = defineModel<string>({ default: '' })

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.sidebar-search {
  padding: 0.4rem;
  border-top: 0.1rem solid var(--color-neutral-border);
  border-bottom: 0.1rem solid var(--color-neutral-border);
}
</style>
