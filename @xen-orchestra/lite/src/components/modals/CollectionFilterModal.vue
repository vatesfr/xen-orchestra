<template>
  <UiModal @submit.prevent="modal.approve(generatedFilter)">
    <ConfirmModalLayout>
      <template #default>
        <div class="rows">
          <CollectionFilterRow
            v-for="(newFilter, index) in newFilters"
            :key="newFilter.id"
            v-model="newFilters[index]"
            :available-filters="availableFilters"
            @remove="removeNewFilter($event)"
          />
        </div>

        <div v-if="newFilters.some(filter => filter.isAdvanced)" class="available-properties">
          {{ $t('available-properties-for-advanced-filter') }}
          <div class="properties typo p1-regular">
            <UiBadge v-for="(filter, property) in availableFilters" :key="property" :icon="getFilterIcon(filter)">
              {{ property }}
            </UiBadge>
          </div>
        </div>
      </template>

      <template #buttons>
        <UiButton size="medium" accent="info" variant="tertiary" @click="addNewFilter()">
          {{ $t('add-or') }}
        </UiButton>
        <ModalDeclineButton />
        <ModalApproveButton :disabled="!isFilterValid">
          {{ $t(editedFilter ? 'update' : 'add') }}
        </ModalApproveButton>
      </template>
    </ConfirmModalLayout>
  </UiModal>
</template>

<script lang="ts" setup>
import CollectionFilterRow from '@/components/CollectionFilterRow.vue'
import ConfirmModalLayout from '@/components/ui/modals/layouts/ConfirmModalLayout.vue'
import ModalApproveButton from '@/components/ui/modals/ModalApproveButton.vue'
import ModalDeclineButton from '@/components/ui/modals/ModalDeclineButton.vue'
import UiModal from '@/components/ui/modals/UiModal.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import { getFilterIcon } from '@/libs/utils'
import type { Filters, NewFilter } from '@/types/filter'
import { IK_MODAL } from '@/types/injection-keys'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { Or, parse } from 'complex-matcher'
import { computed, inject, onMounted, ref } from 'vue'

const props = defineProps<{
  availableFilters: Filters
  editedFilter?: string
}>()

const modal = inject(IK_MODAL)!
const newFilters = ref<NewFilter[]>([])
let newFilterId = 0

const addNewFilter = () =>
  newFilters.value.push({
    id: newFilterId++,
    content: '',
    isAdvanced: false,
    builder: { property: '', comparison: '', value: '', negate: false },
  })

const removeNewFilter = (id: number) => {
  const index = newFilters.value.findIndex(newFilter => newFilter.id === id)
  if (index >= 0) {
    newFilters.value.splice(index, 1)
  }
}

const generatedFilter = computed(() => {
  const filters = newFilters.value.filter(newFilter => newFilter.content !== '')

  if (filters.length === 0) {
    return ''
  }

  if (filters.length === 1) {
    return filters[0].content
  }

  return `|(${filters.map(filter => filter.content).join(' ')})`
})

const isFilterValid = computed(() => generatedFilter.value !== '')

onMounted(() => {
  if (props.editedFilter === undefined) {
    addNewFilter()
    return
  }

  const parsedFilter = parse(props.editedFilter)

  const nodes = parsedFilter instanceof Or ? parsedFilter.children : [parsedFilter]

  newFilters.value = nodes.map(node => ({
    id: newFilterId++,
    content: node.toString(),
    isAdvanced: true,
    builder: { property: '', comparison: '', value: '', negate: false },
  }))
})
</script>

<style lang="postcss" scoped>
.properties {
  margin-top: 1rem;

  ul {
    margin-left: 1rem;
  }

  li {
    cursor: pointer;

    &:hover {
      opacity: 0.7;
    }
  }
}

.available-properties {
  margin-top: 1rem;
}

.properties {
  display: flex;
  margin-top: 0.6rem;
  gap: 0.5rem;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
