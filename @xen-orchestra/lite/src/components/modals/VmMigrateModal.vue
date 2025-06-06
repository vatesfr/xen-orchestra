<template>
  <UiModal @submit.prevent="handleSubmit()">
    <FormModalLayout>
      <template #title>
        {{ t('migrate-n-vms', { n: vmRefs.length }) }}
      </template>

      <div>
        <FormInputWrapper :label="$t('select-destination-host')" light>
          <VtsSelect :id="hostSelectId" accent="brand" />
        </FormInputWrapper>
      </div>

      <template #buttons>
        <ModalDeclineButton />
        <ModalApproveButton>
          {{ t('migrate-n-vms', { n: vmRefs.length }) }}
        </ModalApproveButton>
      </template>
    </FormModalLayout>
  </UiModal>
</template>

<script lang="ts" setup>
import FormInputWrapper from '@/components/form/FormInputWrapper.vue'
import FormModalLayout from '@/components/ui/modals/layouts/FormModalLayout.vue'
import ModalApproveButton from '@/components/ui/modals/ModalApproveButton.vue'
import ModalDeclineButton from '@/components/ui/modals/ModalDeclineButton.vue'
import UiModal from '@/components/ui/modals/UiModal.vue'
import { useVmMigration } from '@/composables/vm-migration.composable'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { IK_MODAL } from '@/types/injection-keys'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  vmRefs: XenApiVm['$ref'][]
}>()

const { t } = useI18n()

const modal = inject(IK_MODAL)!

const { selectedHost, availableHosts, isValid, migrate } = useVmMigration(() => props.vmRefs)

const handleSubmit = () => {
  if (!isValid.value) {
    return
  }

  modal.approve(migrate())
}

const { id: hostSelectId } = useFormSelect(availableHosts, {
  model: selectedHost,
  placeholder: () => t('select-destination-host'),
  option: {
    id: '$ref',
    label: 'name_label',
  },
})
</script>
