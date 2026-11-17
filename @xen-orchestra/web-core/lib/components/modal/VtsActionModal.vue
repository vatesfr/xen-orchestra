<template>
  <UiModal :accent :icon @confirm="isConfirmed && emit('confirm')" @dismiss="emit('cancel')">
    <template #title>
      <span>{{ modalTexts.title }}</span>
    </template>
    <template #content>
      <div class="vts-action-modal">
        <p v-if="modalTexts.message">{{ modalTexts.message }}</p>
        <VtsTypeToConfirmInput
          v-if="confirmationText !== undefined"
          v-model="isTypedTextConfirmed"
          :confirmation-text
        />
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton :disabled="!isConfirmed">
        {{ modalTexts.action }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsTypeToConfirmInput from '@core/components/type-to-confirm-input/VtsTypeToConfirmInput.vue'
import type { ModalAccent } from '@core/components/ui/modal/UiModal.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import type { IconName } from '@core/icons'
import { useMapper } from '@core/packages/mapper/use-mapper.ts'
import type { ActionsByObject, HostActions, ObjectType, VmActions } from '@core/types/object.type.ts'
import { computed, ref } from 'vue'
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
  vmCount: number
  hostName?: never
}

type VtsActionModalHostProps = {
  object: 'host'
  action: HostActions
  vmCount?: never
  hostName: string
}

const {
  action,
  object,
  vmCount = 1,
  hostName,
  confirmationText,
} = defineProps<
  (VtsActionModalVmProps | VtsActionModalHostProps) & {
    accent: ModalAccent
    icon: IconName
    confirmationText?: string
  }
>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const defaultActionByObject: ActionsByObject = {
  vm: 'shutdown',
  host: 'disable',
}

const { t } = useI18n()

const textMappingsByObject: TextMappingByObject = {
  vm: {
    'force-reboot': {
      title: t('modal:vm-force-reboot-title', { n: vmCount }),
      message: t('modal:vm-force-reboot-message', { n: vmCount }),
      action: t('action:force-reboot-n-vms', { n: vmCount }),
    },
    'force-shutdown': {
      title: t('modal:vm-force-shutdown-title', { n: vmCount }),
      message: t('modal:vm-force-shutdown-message', { n: vmCount }),
      action: t('action:force-shutdown-n-vms', { n: vmCount }),
    },
    reboot: {
      title: t('modal:vm-reboot-title', { n: vmCount }),
      message: t('modal:vm-reboot-message', { n: vmCount }),
      action: t('action:reboot-n-vms', { n: vmCount }),
    },
    shutdown: {
      title: t('modal:vm-shutdown-title', { n: vmCount }),
      message: t('modal:vm-shutdown-message', { n: vmCount }),
      action: t('action:shutdown-n-vms', { n: vmCount }),
    },
  },
  host: {
    enable: {
      title: t('modal:confirm-host-enable?', { host: hostName }),
      message: t('modal:host-enable-message'),
      action: t('action:enable-host'),
    },
    disable: {
      title: t('modal:confirm-host-disable?', { host: hostName }),
      message: t('modal:host-disable-message'),
      action: t('action:disable-host'),
    },
    shutdown: {
      title: t('modal:confirm-host-shutdown?', { host: hostName }),
      message: t('modal:host-shutdown-message'),
      action: t('action:shutdown-host'),
    },
    start: {
      title: t('modal:confirm-host-start?', { host: hostName }),
      action: t('action:start-host'),
    },
    forget: {
      title: t('modal:confirm-host-forget?', { host: hostName }),
      message: t('modal:host-forget-message'),
      action: t('action:forget-host'),
    },
    'disable-and-evacuate-vms': {
      title: t('modal:confirm-host-disable-and-evacuate-vms?', { host: hostName }),
      message: t('modal:host-disable-and-evacuate-vms-message'),
      action: t('action:disable-host-and-evacuate-vms'),
    },
    reboot: {
      title: t('modal:confirm-host-reboot?', { host: hostName }),
      message: t('modal:host-reboot-message'),
      action: t('action:reboot-host'),
    },
    'force-reboot': {
      title: t('modal:confirm-host-force-reboot?', { host: hostName }),
      message: t('modal:host-force-reboot-message'),
      action: t('action:force-reboot-host'),
    },
    'smart-reboot': {
      title: t('modal:confirm-host-smart-reboot?', { host: hostName }),
      message: t('modal:host-smart-reboot-message'),
      action: t('action:smart-reboot-host'),
    },
    'restart-toolstack': {
      title: t('modal:confirm-host-restart-toolstack?', { host: hostName }),
      message: t('modal:host-restart-toolstack-message'),
      action: t('action:restart-toolstack'),
    },
    detach: {
      title: t('modal:confirm-host-detach?', { host: hostName }),
      message: t('modal:host-detach-message'),
      action: t('action:detach-host'),
    },
    'emergency-shutdown': {
      title: t('modal:confirm-host-emergency-shutdown?', { host: hostName }),
      message: t('modal:host-emergency-shutdown-message'),
      action: t('action:emergency-shutdown-host'),
    },
  },
}

const modalTexts = useMapper(
  () => action,
  () => textMappingsByObject[object] as Record<ActionsByObject[ObjectType], ActionTexts>,
  () => defaultActionByObject[object]
)

const isTypedTextConfirmed = ref(false)

const isConfirmed = computed(() => confirmationText === undefined || isTypedTextConfirmed.value)
</script>

<style lang="postcss" scoped>
.vts-action-modal {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
