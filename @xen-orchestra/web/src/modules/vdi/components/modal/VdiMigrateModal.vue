<template>
  <div class="vdi-migrate-modal">
    <VtsModal :accent="isOnDifferentHost ? 'warning' : 'info'" dismissible>
      <template #title>
        {{ t('action:migrate-vdi-on-sr') }}
      </template>

      <template #content>
        <div class="form">
          <p class="section-title">{{ t('general-information') }}</p>

          <div class="field">
            <label
              class="field-label field-label--required"
              :class="{ 'field-label--error': showError, 'field-label--warning': isOnDifferentHost }"
            >
              {{ t('destination-sr') }}
            </label>
            <select
              v-model="destinationSrId"
              class="select"
              :class="{ 'select--error': showError, 'select--warning': isOnDifferentHost }"
              @change="showError = false"
            >
              <option disabled value="">{{ t('action:select-storage') }}</option>
              <option v-for="sr in availableSrs" :key="sr.id" :value="sr.id">
                {{ sr.name_label }}
              </option>
            </select>
            <p v-if="showError" class="message message--error">
              <VtsIcon name="status:danger-circle" size="current" />
              {{ t('destination-sr-mandatory') }}
            </p>
            <p v-if="isOnDifferentHost" class="message message--warning">
              <VtsIcon name="status:warning-circle" size="current" />
              {{ t('vdi-on-different-sr-warning') }}
            </p>
          </div>
        </div>
      </template>

      <template #buttons>
        <template v-if="!showError">
          <VtsModalCancelButton />
          <VtsModalConfirmButton @click="handleConfirm">
            {{ isOnDifferentHost ? t('action:force-migrate-on-sr') : t('action:migrate-vdi-on-sr') }}
          </VtsModalConfirmButton>
        </template>
      </template>
    </VtsModal>
  </div>
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
  errorMessage?: string
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
/* Override UiModal (to match Figma design) via deep selector, scoped to this component only */
.vdi-migrate-modal :deep(.ui-modal .modal) {
  background-color: var(--color-neutral-background-primary) !important;
  min-width: min(60rem, calc(100% - 2rem));
}

.vdi-migrate-modal :deep(.ui-modal .main) {
  align-items: flex-start !important;
  text-align: left !important;
}

.vdi-migrate-modal :deep(.content) {
  border-top: 0.1rem solid var(--color-neutral-border);
  border-bottom: 0.1rem solid var(--color-neutral-border);
  margin: 0 -2.4rem;
  padding: 0 2.4rem;
  width: calc(100% + 4.8rem);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  width: 100%;
  text-align: left;
  padding: 3rem 0;
}

.section-title {
  font-weight: 600;
  color: var(--color-brand-txt-base);
  border-bottom: 0.1rem solid var(--color-brand-txt-base);
  padding-bottom: 0.8rem;
  width: 100%;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1.6rem;
}

.field-label {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--color-neutral-txt-secondary);

  &--required::after {
    content: ' *';
    color: var(--color-info-txt-base);
  }

  &--error {
    color: var(--color-danger-txt-base);
  }

  &--warning {
    color: var(--color-warning-txt-base);
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
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b63bf' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1.2rem center;
  padding-right: 3.2rem;

  &--error {
    border-color: var(--color-danger-txt-base);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a11d1d' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  }

  &--warning {
    border-color: var(--color-warning-txt-base);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23aa5b11' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  }
}

.message {
  text-decoration: none;
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
