<template>
  <VtsOverlay type="modal" accent="info" dismissible @confirm="handleSubmit()">
    <template #content>
      <div class="form-selects">
        <VtsSelect :id="sortPropertySelectId" accent="brand" />
        <VtsSelect :id="isAscendingSelectId" accent="brand" />
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton />
      <VtsOverlayConfirmButton :disabled="!newSortProperty">{{ t('action:add') }}</VtsOverlayConfirmButton>
    </template>
  </VtsOverlay>
</template>

<script lang="ts" setup>
import type { NewSort, Sorts } from '@/types/sort'
import VtsOverlay from '@core/components/overlay/VtsOverlay.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { availableSorts } = defineProps<{
  availableSorts: Sorts
}>()

const emit = defineEmits<{
  confirm: [sort: NewSort]
}>()

const { t } = useI18n()

const newSortProperty = ref()
const newSortIsAscending = ref<boolean>(true)

const handleSubmit = () =>
  emit('confirm', {
    property: newSortProperty.value,
    isAscending: newSortIsAscending.value,
  })

const { id: sortPropertySelectId } = useFormSelect(Object.entries(availableSorts), {
  model: newSortProperty,
  option: {
    id: ([property]) => property,
    label: ([property, sort]) => sort.label ?? property,
    value: ([property]) => property,
  },
})

const { id: isAscendingSelectId } = useFormSelect([true, false], {
  model: newSortIsAscending,
  option: {
    id: value => value.toString(),
    label: value => (value ? t('ascending') : t('descending')),
  },
})
</script>

<style lang="postcss" scoped>
.form-selects {
  display: flex;
  gap: 1rem;

  @media (--small) {
    flex-direction: column;
  }
}
</style>
