<template>
  <div class="backup-job-form-email-input">
    <VtsInputWrapper :label :message="errorMessage">
      <div class="field">
        <UiInput
          v-model="email"
          :accent="errorMessage === undefined ? 'brand' : 'danger'"
          type="text"
          @keydown.enter.prevent="addEmail()"
        />
        <UiButton accent="brand" size="medium" variant="secondary" @click="addEmail()">
          {{ t('action:add') }}
        </UiButton>
      </div>
    </VtsInputWrapper>
    <div v-if="model.length > 0" class="chips">
      <UiChip v-for="(recipient, index) of model" :key="recipient" accent="info" @remove="removeEmail(index)">
        {{ recipient }}
      </UiChip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiChip from '@core/components/ui/chip/UiChip.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useMapper } from '@core/packages/mapper'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  label: string
}>()

const model = defineModel<string[]>({ required: true })

const { t } = useI18n()

type EmailErrorType = 'empty' | 'invalid' | 'duplicate'

const email = ref('')

const errorType = ref<EmailErrorType | undefined>(undefined)

const errorLabel = useMapper<EmailErrorType, string>(
  () => errorType.value,
  {
    empty: t('email-mandatory'),
    invalid: t('invalid-email'),
    duplicate: t('email-already-added'),
  },
  'empty'
)

const errorMessage = computed(() =>
  errorType.value === undefined ? undefined : { content: errorLabel.value, accent: 'danger' as const }
)

function addEmail() {
  const value = email.value.trim()

  if (value === '') {
    errorType.value = 'empty'
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    errorType.value = 'invalid'
    return
  }

  if (model.value.includes(value)) {
    errorType.value = 'duplicate'
    return
  }

  model.value = [...model.value, value]
  email.value = ''
  errorType.value = undefined
}

function removeEmail(index: number) {
  model.value = model.value.filter((_, recipientIndex) => recipientIndex !== index)
}
</script>

<style lang="postcss" scoped>
.backup-job-form-email-input {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .field {
    display: flex;
    align-items: center;
    gap: 0.8rem;

    & > :first-child {
      flex: 1;
    }
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
  }
}
</style>
