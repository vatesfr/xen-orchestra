<template>
  <UiModal :accent :icon @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>
      <span>{{ modalTexts.title }}</span>
    </template>
    <template #content>
      <span>{{ modalTexts.message }}</span>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>
        {{ modalTexts.action }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import type { ModalAccent } from '@core/components/ui/modal/UiModal.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import type { IconName } from '@core/icons'
import { useMapper } from '@core/packages/mapper/use-mapper.ts'
import type { ActionsByObject, HostActions, ObjectType, VmActions } from '@core/types/object.type.ts'
import { useI18n } from 'vue-i18n'

type ActionTexts = {
  title: string
  message: string
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

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const defaultActionByObject: { [O in ObjectType]: ActionsByObject[O] } = {
  vm: 'shutdown',
  host: 'disable',
}

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
  },
}

const modalTexts = useMapper(
  () => action,
  () => textMappingsByObject[object] as Record<ActionsByObject[ObjectType], ActionTexts>,
  () => defaultActionByObject[object]
)
</script>
