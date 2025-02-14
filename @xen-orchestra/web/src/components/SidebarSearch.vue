<template>
  <div class="sidebar-search">
    <DropdownTitle>{{ $t('sidebar.vms-treeview') }}</DropdownTitle>
    <UiInput
      v-model="search"
      :aria-label="$t('sidebar.search-tree-view')"
      :icon="faMagnifyingGlass"
      :placeholder="$t('sidebar.search-tree-view')"
      accent="brand"
    />
  </div>
</template>

<script lang="ts" setup>
import DropdownTitle from '@core/components/dropdown/DropdownTitle.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'

const search = defineModel<string>({ default: '' })
</script>

<style lang="postcss" scoped>
.sidebar-search {
  padding: 0.4rem;
  border-bottom: 0.1rem solid var(--color-neutral-border);
}
</style>
