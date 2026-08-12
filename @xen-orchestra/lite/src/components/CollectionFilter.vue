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
      {{ t('action:add-filter') }}
    </UiActionButton>
  </UiFilterGroup>
</template>

<script lang="ts" setup>
import UiActionButton from '@/components/ui/UiActionButton.vue'
import UiFilter from '@/components/ui/UiFilter.vue'
import UiFilterGroup from '@/components/ui/UiFilterGroup.vue'
import type { Filters } from '@/types/filter'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
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

const { open } = useOverlay({
  component: () => import('@/components/modals/CollectionFilterModal.vue'),
  events: {
    onCancel: true,
  },
})

function openFilterModal(editedFilter?: string) {
  return open({
    props: { editedFilter, availableFilters },
    events: {
      onConfirm: newFilter => {
        if (editedFilter !== undefined) {
          emit('removeFilter', editedFilter)
        }

        emit('addFilter', newFilter)
      },
    },
  })
}
</script>
