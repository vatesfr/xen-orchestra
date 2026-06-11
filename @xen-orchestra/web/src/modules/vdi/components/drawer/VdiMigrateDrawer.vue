<template>
  <VtsDrawer dismissible is-open @dismiss="emit('cancel')">
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
              {{ getSrOptionLabel(sr) }}
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
        <VtsDrawerCancelButton />
        <VtsDrawerConfirmButton @click="handleConfirm">
          {{ isOnDifferentHost ? t('action:force-migrate-on-sr') : t('action:migrate-vdi-on-sr') }}
        </VtsDrawerConfirmButton>
      </template>
    </template>
  </VtsDrawer>
</template>

<script lang="ts" setup>
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import {
  useXoSrCollection,
  type FrontXoSr,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.js'
import { formatSize } from '@core/utils/size.util.ts'
import VtsDrawer from '@xen-orchestra/web-core/components/drawer/VtsDrawer.vue'
import VtsDrawerCancelButton from '@xen-orchestra/web-core/components/drawer/VtsDrawerCancelButton.vue'
import VtsDrawerConfirmButton from '@xen-orchestra/web-core/components/drawer/VtsDrawerConfirmButton.vue'
import VtsIcon from '@xen-orchestra/web-core/components/icon/VtsIcon.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  vdi: FrontXoVdi
}>()

const emit = defineEmits<{
  confirm: [srId: string]
  cancel: []
}>()

const { t } = useI18n()

const { srs, useGetSrById } = useXoSrCollection()

const { getSrLocation } = useXoSrUtils()

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

function getSrFreeSize(sr: FrontXoSr) {
  return Math.max(sr.size - sr.physical_usage, 0)
}

function getSrOptionLabel(sr: FrontXoSr) {
  const location = getSrLocation(sr)
  const freeSize = formatSize(getSrFreeSize(sr), 0)

  return `${sr.name_label} (${location}) - ${freeSize} left`
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
  color: var(--color-brand-txt-base);
  border-bottom: 0.1rem solid var(--color-brand-txt-base);
  padding-bottom: 0.8rem;
  width: 100%;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
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
