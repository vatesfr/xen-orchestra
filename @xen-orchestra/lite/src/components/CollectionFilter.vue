<template>
  <UiFilterGroup>
    <UiFilter
      v-for="filter in activeFilters"
      :key="filter"
      @edit="openModal(filter)"
      @remove="emit('removeFilter', filter)"
    >
      {{ filter }}
    </UiFilter>

    <UiActionButton :icon="faPlus" class="add-filter" @click="openModal()">
      {{ t('add-filter') }}
    </UiActionButton>
  </UiFilterGroup>
</template>

<script lang="ts" setup>
import UiActionButton from '@/components/ui/UiActionButton.vue'
import UiFilter from '@/components/ui/UiFilter.vue'
import UiFilterGroup from '@/components/ui/UiFilterGroup.vue'
import { useModal } from '@/composables/modal.composable'
import type { Filters } from '@/types/filter'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  activeFilters: string[]
  availableFilters: Filters
}>()

const emit = defineEmits<{
  addFilter: [filter: string]
  removeFilter: [filter: string]
}>()

const { t } = useI18n()

const openModal = (editedFilter?: string) => {
  const { onApprove } = useModal<string>(() => import('@/components/modals/CollectionFilterModal.vue'), {
    availableFilters: props.availableFilters,
    editedFilter,
  })

  if (editedFilter !== undefined) {
    onApprove(() => emit('removeFilter', editedFilter))
  }

  onApprove(newFilter => emit('addFilter', newFilter))
}
</script>
