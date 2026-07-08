<template>
  <UiModal accent="info" @confirm="emit('confirm', selectedHost)" @dismiss="emit('cancel')">
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
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton :disabled="!selectedHost">
        {{ t('action:migrate-n-vms', { n: count }) }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useFormSelect } from '@core/packages/form-select'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { availableHosts } = defineProps<{
  count: number
  availableHosts: XenApiHost[]
}>()

const emit = defineEmits<{
  confirm: [selectedHost: XenApiHost | undefined]
  cancel: []
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
