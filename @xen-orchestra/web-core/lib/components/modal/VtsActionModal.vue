<template>
  <VtsModal :accent icon="status:info-picto">
    <template #title>
      <span>{{ modalTexts.title }}</span>
    </template>
    <template #content>
      <span>{{ modalTexts.message }}</span>
    </template>
    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>
        {{ modalTexts.action }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import type { ModalAccent } from '@core/components/ui/modal/UiModal.vue'
import { useMapper } from '@core/packages/mapper/use-mapper.ts'
import { useI18n } from 'vue-i18n'

type ObjectType = 'vm'
type XoVmActions = 'reboot' | 'shutdown' | 'force-reboot' | 'force-shutdown'
type ActionTexts = {
  title: string
  message: string
  action: string
}

const { action, object } = defineProps<{
  action: XoVmActions
  accent: ModalAccent
  object: ObjectType
}>()

const { t } = useI18n()

const textMappingsByObject: Record<ObjectType, Record<XoVmActions, ActionTexts>> = {
  vm: {
    'force-reboot': {
      title: t('modal:confirm-vm-force-reboot'),
      message: t('modal:vm-force-reboot-message'),
      action: t('modal:action:vm-force-reboot'),
    },
    'force-shutdown': {
      title: t('modal:confirm-vm-force-shutdown'),
      message: t('modal:vm-force-shutdown-message'),
      action: t('modal:action:vm-force-shutdown'),
    },
    reboot: {
      title: t('modal:confirm-vm-reboot'),
      message: t('modal:vm-reboot-message'),
      action: t('modal:action:vm-reboot'),
    },
    shutdown: {
      title: t('modal:confirm-vm-shutdown'),
      message: t('modal:vm-shutdown-message'),
      action: t('modal:action:vm-shutdown'),
    },
  },
}

const modalTexts = useMapper(
  () => action,
  () => textMappingsByObject[object],
  () => 'shutdown'
)
</script>
