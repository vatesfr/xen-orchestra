<template>
  <VtsModal :accent :icon dismissible>
    <template #title>
      <span>{{ modalTexts.title }}</span>
    </template>
    <template #content>
      <span v-if="modalTexts.message">{{ modalTexts.message }}</span>
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
import type { IconName } from '@core/icons'
import { useMapper } from '@core/packages/mapper/use-mapper.ts'
import type { ActionsByObject, HostActions, ObjectType, VmActions } from '@core/types/object.type.ts'
import { useI18n } from 'vue-i18n'

type ActionTexts = {
  title: string
  message?: string
  action: string
}

type TextMappingByObject = {
  [O in ObjectType]: Record<ActionsByObject[O], ActionTexts>
}

type VtsActionModalVmProps = {
  object: 'vm'
  action: VmActions
  hostName?: never
}

type VtsActionModalHostProps = {
  object: 'host'
  action: HostActions
  hostName: string
}

const { action, object, hostName } = defineProps<
  (VtsActionModalVmProps | VtsActionModalHostProps) & {
    accent: ModalAccent
    icon: IconName
  }
>()

const { t } = useI18n()

const textMappingsByObject: TextMappingByObject = {
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
  host: {
    enable: {
      title: t('modal:confirm-host-enable', { host: hostName }),
      message: t('modal:host-enable-message'),
      action: t('action:enable-host'),
    },
    disable: {
      title: t('modal:confirm-host-disable', { host: hostName }),
      message: t('modal:host-disable-message'),
      action: t('action:disable-host'),
    },
    shutdown: {
      title: t('modal:confirm-host-disable', { host: hostName }),
      message: t('modal:host-disable-message'),
      action: t('action:disable-host'),
    },
    start: {
      title: t('modal:confirm-host-disable', { host: hostName }),
      message: t('modal:host-disable-message'),
      action: t('action:disable-host'),
    },
  },
}

const modalTexts = useMapper(
  () => action,
  () => textMappingsByObject[object] as Record<ActionsByObject[ObjectType], ActionTexts>,
  () => 'shutdown'
)
</script>
