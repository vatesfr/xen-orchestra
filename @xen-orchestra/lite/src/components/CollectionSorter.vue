<template>
  <UiFilterGroup class="collection-sorter">
    <UiFilter
      v-for="[property, isAscending] in activeSorts"
      :key="property"
      @edit="emit('toggleSortDirection', property)"
      @remove="emit('removeSort', property)"
    >
      <span class="property">
        <UiIcon :icon="isAscending ? faCaretUp : faCaretDown" />
        {{ property }}
      </span>
    </UiFilter>

    <UiActionButton :icon="faPlus" class="add-sort" @click="openModal()">
      {{ t('add-sort') }}
    </UiActionButton>
  </UiFilterGroup>
</template>

<script lang="ts" setup>
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import UiActionButton from '@/components/ui/UiActionButton.vue'
import UiFilter from '@/components/ui/UiFilter.vue'
import UiFilterGroup from '@/components/ui/UiFilterGroup.vue'
import { useModal } from '@/composables/modal.composable'
import type { ActiveSorts, NewSort, Sorts } from '@/types/sort'
import { faCaretDown, faCaretUp, faPlus } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  availableSorts: Sorts
  activeSorts: ActiveSorts<Record<string, any>>
}>()

const emit = defineEmits<{
  toggleSortDirection: [property: string]
  addSort: [property: string, isAscending: boolean]
  removeSort: [property: string]
}>()

const { t } = useI18n()

const openModal = () => {
  const { onApprove } = useModal<NewSort>(() => import('@/components/modals/CollectionSorterModal.vue'), {
    availableSorts: computed(() => props.availableSorts),
  })

  onApprove(({ property, isAscending }) => emit('addSort', property, isAscending))
}
</script>

<style lang="postcss" scoped>
.property {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
}
</style>
