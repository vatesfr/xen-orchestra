<template>
  <UiModal :accent="isOnDifferentHost ? 'warning' : 'info'" :on-dismiss="() => emit('dismiss')">
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
            <VtsIcon name="fa:exclamation" size="current" />
            {{ t('destination-sr-mandatory') }}
          </p>
          <p v-if="isOnDifferentHost" class="message message--warning">
            <VtsIcon name="fa:exclamation" size="current" />
            {{ t('vdi-on-different-sr-warning') }}
          </p>
        </div>
      </div>
    </template>

    <template #buttons>
      <UiButton accent="brand" size="medium" variant="secondary" @click="emit('dismiss')">
        {{ t('cancel') }}
      </UiButton>
      <UiButton
        v-if="isOnDifferentHost"
        accent="warning"
        size="medium"
        variant="primary"
        :busy="isRunning"
        @click="handleConfirm"
      >
        {{ t('action:force-migrate-on-sr') }}
      </UiButton>
      <UiButton v-else accent="brand" size="medium" variant="primary" :busy="isRunning" @click="handleConfirm">
        {{ t('action:migrate-vdi-on-sr') }}
      </UiButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import {
  useXoSrCollection,
  type FrontXoSr,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
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

const destinationSrId = ref<FrontXoSr['id'] | undefined>(undefined)
const showError = ref(false)

// Exclude the VDI's current SR
const availableSrs = computed(() => srs.value.filter((sr: FrontXoSr) => sr.id !== props.vdi.$SR))

const currentSr = useGetSrById(() => props.vdi.$SR)
const selectedSr = useGetSrById(() => destinationSrId.value)

// SR is on a different host when $container differs from the current SR's $container
const isOnDifferentHost = computed(() => {
  if (!selectedSr.value || !currentSr.value) return false
  return selectedSr.value.$container !== currentSr.value.$container
})

function handleConfirm() {
  if (!destinationSrId.value) {
    showError.value = true
    return
  }
  showError.value = false
  emit('confirm', destinationSrId.value)
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
