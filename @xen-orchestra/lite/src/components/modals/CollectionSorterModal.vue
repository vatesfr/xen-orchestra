<template>
  <UiModal @submit.prevent="handleSubmit">
    <ConfirmModalLayout>
      <template #default>
        <div class="form-selects">
          <FormSelect v-model="newSortProperty" :label="t('sort-by')">
            <option v-if="!newSortProperty" />
            <option v-for="(sort, property) in availableSorts" :key="property" :value="property">
              {{ sort.label ?? property }}
            </option>
          </FormSelect>
          <FormSelect v-model="newSortIsAscending">
            <option :value="true">{{ t('ascending') }}</option>
            <option :value="false">{{ t('descending') }}</option>
          </FormSelect>
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
import FormSelect from '@/components/form/FormSelect.vue'
import ConfirmModalLayout from '@/components/ui/modals/layouts/ConfirmModalLayout.vue'
import ModalApproveButton from '@/components/ui/modals/ModalApproveButton.vue'
import ModalDeclineButton from '@/components/ui/modals/ModalDeclineButton.vue'
import UiModal from '@/components/ui/modals/UiModal.vue'
import { IK_MODAL } from '@/types/injection-keys'
import type { NewSort, Sorts } from '@/types/sort'
import { inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
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
</script>

<style lang="postcss" scoped>
.form-selects {
  display: flex;
  gap: 1rem;
}
</style>
