<template>
  <UiModal accent="danger" icon="status:danger-picto" @dismiss="emit('close')">
    <template #title>
      <span>{{ modalTexts.title }}</span>
    </template>

    <template #content>
      <div class="message">
        <span>{{ modalTexts.message }}</span>
        <span>{{ modalTexts.subMessage }}</span>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('close')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <UiLink :href icon="action:edit" size="medium" @click="emit('close')">
        {{ t('action:edit-config') }}
      </UiLink>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useMapper } from '@core/packages/mapper/use-mapper.ts'
import type { VmBlockedOperations } from '@core/types/object.type.ts'
import { useI18n } from 'vue-i18n'

type BlockedOperationText = {
  title: string
  message: string
  subMessage: string
}

const { blockedOperation } = defineProps<{
  blockedOperation: VmBlockedOperations
  href?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const textMappings: Record<VmBlockedOperations, BlockedOperationText> = {
  clean_shutdown: {
    title: t('shutdown-blocked'),
    message: t('vm-protected-shutdown'),
    subMessage: t('vm-disable-blocked-protection'),
  },
  hard_shutdown: {
    title: t('force-shutdown-blocked'),
    message: t('vm-protected-force-shutdown'),
    subMessage: t('vm-disable-blocked-protection'),
  },
  pause: {
    title: t('pause-blocked'),
    message: t('vm-protected-pause'),
    subMessage: t('vm-disable-blocked-protection'),
  },
  clean_reboot: {
    title: t('reboot-blocked'),
    message: t('vm-protected-reboot'),
    subMessage: t('vm-disable-blocked-protection'),
  },
  hard_reboot: {
    title: t('force-reboot-blocked'),
    message: t('vm-protected-force-reboot'),
    subMessage: t('vm-disable-blocked-protection'),
  },
  suspend: {
    title: t('suspend-blocked'),
    message: t('vm-protected-suspend'),
    subMessage: t('vm-disable-blocked-protection'),
  },
  destroy: {
    title: t('deletion-blocked'),
    message: t('vm-protected-deletion'),
    subMessage: t('vm-disable-delete-protection'),
  },
}

const modalTexts = useMapper(() => blockedOperation, textMappings, 'clean_shutdown')
</script>

<style lang="postcss" scoped>
.message {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
}
</style>
