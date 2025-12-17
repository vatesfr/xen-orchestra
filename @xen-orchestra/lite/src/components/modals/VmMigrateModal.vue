<template>
  <VtsModal accent="info" @confirm="emit('confirm', selectedHost)">
    <template #title>
      {{ t('action:migrate-n-vms', { n: count }) }}
    </template>

    <template #content>
      <div>
        <VtsInputWrapper :label="t('select-destination-host')">
          <VtsSelect :id="hostSelectId" accent="brand" />
        </VtsInputWrapper>
      </div>
    </template>

    <template #buttons>
      <VtsModalCancelButton />
      <VtsModalConfirmButton :disabled="!selectedHost">
        {{ t('action:migrate-n-vms', { n: count }) }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { availableHosts } = defineProps<{
  count: number
  availableHosts: XenApiHost[]
}>()

const emit = defineEmits<{
  confirm: [selectedHost: XenApiHost | undefined]
}>()

const selectedHost = ref<XenApiHost>()

const { t } = useI18n()

const { id: hostSelectId } = useFormSelect(availableHosts, {
  model: selectedHost,
  placeholder: () => t('select-destination-host'),
  option: {
    id: '$ref',
    label: 'name_label',
  },
})
</script>
