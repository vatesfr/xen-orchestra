<template>
  <UiModal :accent="isVdiOnDifferentSr ? 'warning' : 'info'" :on-dismiss="() => emit('close')">
    <template #title>
      {{ $t('action:migrate-vdi-on-sr') }}
    </template>

    <template #content>
      <FormSection :title="$t('general-information')">
        <FormRow :label="$t('destination-sr')" required>
          <UiSelect
            v-model="destinationSrId"
            :options="srOptions"
            :placeholder="$t('action:select-storage')"
            :loading="isSrsLoading"
            :error="errors.destinationSrId"
            option-value="id"
            option-label="name"
          />
          <p v-if="errors.destinationSrId" class="error-message">
            <VtsIcon name="fa:exclamation-circle" size="current" />
            {{ errors.destinationSrId }}
          </p>
          <p v-if="isVdiOnDifferentSr" class="warning-message">
            <VtsIcon name="fa:exclamation-circle" size="current" />
            {{ $t('vdi-on-different-sr-warning') }}
          </p>
        </FormRow>
      </FormSection>
    </template>

    <template #buttons>
      <UiButton accent="brand" size="medium" variant="secondary" @click="emit('close')">
        {{ $t('cancel') }}
      </UiButton>
      <UiButton
        v-if="isVdiOnDifferentSr"
        accent="warning"
        size="medium"
        variant="primary"
        :busy="isMigrating"
        @click="handleMigrate(true)"
      >
        {{ $t('action:force-migrate-on-sr') }}
      </UiButton>
      <UiButton v-else accent="brand" size="medium" variant="primary" :busy="isMigrating" @click="handleMigrate(false)">
        {{ $t('action:migrate-vdi-on-sr') }}
      </UiButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import FormRow from '@/components/ui/FormRow.vue'
import FormSection from '@/components/ui/FormSection.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import { useI18n } from '@/composables/i18n'
import { useNotification } from '@/composables/useNotification'
import { fetchSrs } from '@/libs/xapi/sr'
import { migrateVdi } from '@/libs/xapi/vdi'
import type { XenApiVdi } from '@/libs/xen-api/xen-api.types'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { computed, onMounted, ref } from 'vue'

interface SrOption {
  id: string
  name: string
  hostRef?: string
}

const props = defineProps<{
  vdi: XenApiVdi
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const { t } = useI18n()

const { notifySuccess, notifyError } = useNotification()

const destinationSrId = ref<string | undefined>(undefined)

const isSrsLoading = ref(false)

const isMigrating = ref(false)

const srOptions = ref<SrOption[]>([])

const errors = ref<{ destinationSrId?: string }[]>([])

/* A VDI is "on a different SR" when the selected SR is not on the same host
as the current SR hosting this VDI. This triggers a "force migrate" warning.
*/
const isVdiOnDifferentSr = computed(() => {
  if (!destinationSrId.value) return false
  const selectedSr = srOptions.value.find(sr => sr.id === destinationSrId.value)
  return selectedSr?.hostRef !== props.vdi.$container?.hostRef
})

onMounted(async () => {
  isSrsLoading.value = true
  try {
    const srs = await fetchSrs()
    // Exclude the current SR of this VDI
    srOptions.value = srs
      .filter(sr => sr.id !== props.vdi.SR)
      .map(sr => ({ id: sr.id, name: sr.name_label, hostRef: sr.hostRef }))
  } catch {
    notifyError(t('unable-to-migrate-vdi'))
  } finally {
    isSrsLoading.value = false
  }
})

function validate(): boolean {
  errors.value = {}
  if (!destinationSrId.value) {
    errors.value.destinationSrId = t('destination-sr-mandatory')
    return false
  }
  return true
}

async function handleMigrate(force: boolean) {
  if (!validate()) return

  isMigrating.value = true
  try {
    await migrateVdi({
      vdiRef: props.vdi.$ref,
      srRef: destinationSrId.value!,
      force,
    })
    notifySuccess(t('success'))
    emit('success')
    emit('close')
  } catch (err) {
    notifyError(t('unable-to-migrate-vdi'))
    console.error('[MigrateVdiModal] migration failed', err)
  } finally {
    isMigrating.value = false
  }
}
</script>

<style lang="postcss" scoped>
.error-message {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.4rem;
  font-size: 0.85rem;
  color: var(--color-danger-txt-base);
}

.warning-message {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.4rem;
  font-size: 0.85rem;
  color: var(--color-warning-txt-base);
}
</style>
