<template>
  <div class="docker-address-field">
    <template v-if="hasCandidateAddresses">
      <VtsInputWrapper :label="selectBindings.label" :message="selectBindings.error">
        <VtsSelect :id="selectBindings.id" accent="brand" />
      </VtsInputWrapper>
      <DockerTextInput
        v-if="isCustomHost"
        v-bind="customHostBindings"
        :label="t('docker-address-custom')"
        :info="t('docker-address-info')"
        placeholder="docker.example.org"
      />
    </template>
    <!-- no address reported by the VM (no guest tools, or halted) -->
    <DockerTextInput v-else v-bind="customHostBindings" :info="t('docker-address-info')" />
  </div>
</template>

<script lang="ts" setup>
import DockerTextInput from '@/modules/docker/components/form/connection/inputs/DockerTextInput.vue'
import type { FormSelectId } from '@core/packages/form-select'
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  hasCandidateAddresses: boolean
  isCustomHost: boolean
  selectBindings: { id: FormSelectId; label: string; error?: InputWrapperMessage }
  customHostBindings: {
    modelValue: string
    'onUpdate:modelValue': (value: string) => void
    label: string
    error?: InputWrapperMessage
    required?: boolean
    onBlur?: () => void
  }
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.docker-address-field {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
