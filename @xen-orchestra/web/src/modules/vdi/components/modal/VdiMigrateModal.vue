<template>
  <VtsModal :accent="isOnDifferentHost ? 'warning' : 'info'" dismissible>
    <template #title>
      {{ t('action:migrate-vdi-on-sr') }}
    </template>

    <template #content>
      <div class="form">
        <p class="section-title">{{ t('general-information') }}</p>

        <div class="field">
          <label class="field-label field-label--required">{{ t('destination-sr') }}</label>
          <select v-model="destinationSrId" class="select" :class="{ 'select--error': showError }">
            <option disabled value="">{{ t('action:select-storage') }}</option>
            <option v-for="sr in availableSrs" :key="sr.id" :value="sr.id">
              {{ sr.name_label }}
            </option>
          </select>
          <p v-if="showError" class="message message--error">
            <VtsIcon name="fa:exclamation-circle" size="current" />
            {{ t('destination-sr-mandatory') }}
          </p>
          <p v-if="isOnDifferentHost" class="message message--warning">
            <VtsIcon name="fa:exclamation-circle" size="current" />
            {{ t('vdi-on-different-sr-warning') }}
          </p>
        </div>
      </div>
    </template>

    <template #buttons>
      <VtsModalCancelButton />
      <VtsModalConfirmButton :on-click="handleConfirm">
        {{ isOnDifferentHost ? t('action:force-migrate-on-sr') : t('action:migrate-vdi-on-sr') }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import {
  useXoSrCollection,
  type FrontXoSr,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  vdi: FrontXoVdi
  isRunning?: boolean
}>()

const emit = defineEmits<{
  dismiss: []
  confirm: [srId: string]
}>()

const { t } = useI18n()

const { srs, useGetSrById } = useXoSrCollection()

// For HTML <select>, '' is more stable than undefined
const destinationSrId = ref<FrontXoSr['id'] | ''>('')

const showError = ref(false)

// Exclude the VDI's current SR
const availableSrs = computed(() => srs.value.filter((sr: FrontXoSr) => sr.id !== props.vdi.$SR))

const currentSr = useGetSrById(() => props.vdi.$SR)

const selectedSrId = computed<FrontXoSr['id'] | undefined>(() => {
  return destinationSrId.value === '' ? undefined : destinationSrId.value
})

const selectedSr = useGetSrById(selectedSrId)

// SR is on a different host when $container differs from the current SR's $container
const isOnDifferentHost = computed(() => {
  if (!selectedSr.value || !currentSr.value) return false
  return selectedSr.value.$container !== currentSr.value.$container
})

function handleConfirm() {
  const srId = selectedSrId.value
  if (srId === undefined) {
    showError.value = true
    return
  }
  showError.value = false
  emit('confirm', srId)
}
</script>

<style lang="postcss" scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  width: 100%;
  text-align: left;
}

.section-title {
  font-weight: 600;
  color: var(--color-neutral-txt-primary);
  border-bottom: 0.1rem solid var(--color-neutral-border);
  padding-bottom: 0.8rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-label {
  font-size: 1.4rem;
  color: var(--color-neutral-txt-secondary);

  &--required::after {
    content: ' *';
    color: var(--color-danger-txt-base);
  }
}

.select {
  width: 100%;
  padding: 0.8rem 1.2rem;
  border-radius: 0.4rem;
  border: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);
  color: var(--color-neutral-txt-primary);
  font-size: 1.4rem;

  &--error {
    border-color: var(--color-danger-txt-base);
  }
}

.message {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1.2rem;

  &--error {
    color: var(--color-danger-txt-base);
  }

  &--warning {
    color: var(--color-warning-txt-base);
  }
}
</style>
