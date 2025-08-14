<template>
  <VtsModal accent="info" dismissible @confirm="emit('confirm', generatedFilter)">
    <template #content>
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
        {{ t('available-properties-for-advanced-filter') }}
        <div class="properties typo-body-regular">
          <UiBadge v-for="(filter, property) in availableFilters" :key="property" :icon="getFilterIcon(filter)">
            {{ property }}
          </UiBadge>
        </div>
      </div>
    </template>
    <template #buttons>
      <VtsModalButton variant="tertiary" @click="addNewFilter()">
        {{ t('add-or') }}
      </VtsModalButton>
      <VtsModalCancelButton />
      <VtsModalConfirmButton :disabled="!isFilterValid">
        {{ editedFilter ? t('update') : t('add') }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import CollectionFilterRow from '@/components/CollectionFilterRow.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import { getFilterIcon } from '@/libs/utils'
import type { Filters, NewFilter } from '@/types/filter'
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalButton from '@core/components/modal/VtsModalButton.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import { Or, parse } from 'complex-matcher'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  availableFilters: Filters
  editedFilter?: string
}>()

const emit = defineEmits<{
  confirm: [filter: string]
}>()

const { t } = useI18n()

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
