<template>
  <UiModal @submit.prevent="handleSubmit">
    <ConfirmModalLayout>
      <template #default>
        <div class="form-selects">
          <VtsSelect :id="sortPropertySelectId" accent="brand" />
          <VtsSelect :id="isAscendingSelectId" accent="brand" />
        </div>
      </template>

      <template #buttons>
        <ModalDeclineButton />
        <ModalApproveButton>{{ t('add') }}</ModalApproveButton>
      </template>
    </ConfirmModalLayout>
  </UiModal>
</template>

<script lang="ts" setup>
import ConfirmModalLayout from '@/components/ui/modals/layouts/ConfirmModalLayout.vue'
import ModalApproveButton from '@/components/ui/modals/ModalApproveButton.vue'
import ModalDeclineButton from '@/components/ui/modals/ModalDeclineButton.vue'
import UiModal from '@/components/ui/modals/UiModal.vue'
import { IK_MODAL } from '@/types/injection-keys'
import type { NewSort, Sorts } from '@/types/sort'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'
import { inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { availableSorts } = defineProps<{
  availableSorts: Sorts
}>()

const { t } = useI18n()

const newSortProperty = ref()
const newSortIsAscending = ref<boolean>(true)

const modal = inject(IK_MODAL)!

const handleSubmit = () => {
  modal.approve<NewSort>({
    property: newSortProperty.value,
    isAscending: newSortIsAscending.value,
  })
}

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
}
</style>
