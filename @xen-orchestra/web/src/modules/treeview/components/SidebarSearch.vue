<template>
  <div class="sidebar-search" :class="{ 'border-top': !uiStore.isSmall }">
    <UiInput
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
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

const search = defineModel<string>({ default: '' })

const { t } = useI18n()
const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.sidebar-search {
  padding: 0.4rem;
  border-bottom: 0.1rem solid var(--color-neutral-border);

  &.border-top {
    border-top: 0.1rem solid var(--color-neutral-border);
  }
}
</style>
