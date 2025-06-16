<template>
  <UiModal @submit.prevent="handleSubmit()">
    <FormModalLayout>
      <template #title>
        {{ t('migrate-n-vms', { n: vmRefs.length }) }}
      </template>

      <div>
        <FormInputWrapper :label="t('select-destination-host')" light>
          <FormSelect v-model="selectedHost">
            <option :value="undefined">
              {{ t('select-destination-host') }}
            </option>
            <option v-for="host in availableHosts" :key="host.$ref" :value="host">
              {{ host.name_label }}
            </option>
          </FormSelect>
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
import FormSelect from '@/components/form/FormSelect.vue'
import FormModalLayout from '@/components/ui/modals/layouts/FormModalLayout.vue'
import ModalApproveButton from '@/components/ui/modals/ModalApproveButton.vue'
import ModalDeclineButton from '@/components/ui/modals/ModalDeclineButton.vue'
import UiModal from '@/components/ui/modals/UiModal.vue'
import { useVmMigration } from '@/composables/vm-migration.composable'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { IK_MODAL } from '@/types/injection-keys'
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
</script>
