<template>
  <UiFilterGroup>
    <UiFilter
      v-for="filter in activeFilters"
      :key="filter"
      @edit="openFilterModal(filter)"
      @remove="emit('removeFilter', filter)"
    >
      {{ filter }}
    </UiFilter>

    <UiActionButton icon="fa:plus" class="add-filter" @click="openFilterModal()">
      {{ t('add-filter') }}
    </UiActionButton>
  </UiFilterGroup>
</template>

<script lang="ts" setup>
import UiActionButton from '@/components/ui/UiActionButton.vue'
import UiFilter from '@/components/ui/UiFilter.vue'
import UiFilterGroup from '@/components/ui/UiFilterGroup.vue'
import type { Filters } from '@/types/filter'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { availableFilters } = defineProps<{
  activeFilters: string[]
  availableFilters: Filters
}>()

const emit = defineEmits<{
  addFilter: [filter: string]
  removeFilter: [filter: string]
}>()

const { t } = useI18n()

const openFilterModal = useModal((editedFilter?: string) => ({
  component: import('@/components/modals/CollectionFilterModal.vue'),
  props: {
    editedFilter,
    availableFilters: computed(() => availableFilters),
  },
  onConfirm: async newFilter => {
    if (editedFilter !== undefined) {
      emit('removeFilter', editedFilter)
    }

    emit('addFilter', newFilter)
  },
}))
</script>
