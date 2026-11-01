<template>
  <UiModal
    :accent="release ? 'info' : 'danger'"
    :icon="release ? 'fa:lock-open' : 'fa:lock'"
    @confirm="emit('confirm')"
    @dismiss="emit('cancel')"
  >
    <template #title>
      <I18nT :keypath="release ? 'firewall:vm:release:title' : 'firewall:vm:quarantine:title'" scope="global" tag="div">
        <template #vm>
          <strong>{{ vmName }}</strong>
        </template>
      </I18nT>
    </template>
    <template #content>
      <div class="vdf-quarantine-modal">
        <template v-if="release">{{ t('firewall:vm:release:message') }}</template>
        <template v-else>
          <p>{{ t('firewall:vm:quarantine:message') }}</p>
          <UiAlert accent="warning">{{ t('firewall:vm:quarantine:xo-warning') }}</UiAlert>
        </template>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>
        {{ release ? t('firewall:vm:release') : t('firewall:vm:quarantine') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { I18nT, useI18n } from 'vue-i18n'

// Quarantine cuts a VM's traffic at once, open connections included: it
// says so before, and releasing says what comes back
defineProps<{
  vmName: string
  release?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.vdf-quarantine-modal {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  max-width: 56rem;
  text-align: start;
}
</style>
