<template>
  <VdfContentModal accent="warning" size="medium" @confirm="emit('confirm', clear)" @dismiss="emit('cancel')">
    <template #title>{{ t('firewall:unlock:title', { device: target.device, vm: target.vmName }) }}</template>
    <template #content>
      <div class="vdf-unlock-modal">
        <p>{{ t('firewall:unlock:message') }}</p>
        <UiCheckbox v-if="target.allowed.length > 0" v-model="clear" accent="brand">
          {{ t('firewall:unlock:clear', { addresses: formatAddressList(target.allowed) }) }}
        </UiCheckbox>
        <UiAlert v-if="state.error" accent="danger">{{ state.error }}</UiAlert>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('cancel') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>{{ t('firewall:unlock:confirm') }}</VtsOverlayConfirmButton>
    </template>
  </VdfContentModal>
</template>

<script lang="ts" setup>
import VdfContentModal from '@/modules/vdf/components/VdfContentModal.vue'
import type { VdfUnlockTarget } from '@/modules/vdf/composables/vdf-lock.composable.ts'
import { formatAddressList } from '@/modules/vdf/utils/vdf-locking.util.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

// Removing a VDF lock (vdf#41): the interface may then use any address.
// Its allowed addresses stay unless the user clears them.
const { target, state } = defineProps<{
  target: VdfUnlockTarget
  // filled in by the caller as the unlock runs
  state: { error?: string }
}>()

// clear: the allowed addresses too
const emit = defineEmits<{
  confirm: [clear: boolean]
  cancel: []
}>()

const { t } = useI18n()

const clear = ref(false)
</script>

<style lang="postcss" scoped>
.vdf-unlock-modal {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
