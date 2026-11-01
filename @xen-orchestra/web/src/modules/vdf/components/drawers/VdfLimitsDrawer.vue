<template>
  <UiDrawer class="vdf-limits-drawer" @confirm="submit()" @dismiss="emit('cancel')">
    <template #title>{{ t('firewall:limits') }}</template>

    <template #content>
      <div class="fields">
        <UiAlert accent="info">{{ t('firewall:limits:info') }}</UiAlert>

        <UiRadioButtonGroup :label="t('firewall:limits:ceiling')" accent="brand" gap="narrow" vertical>
          <UiRadioButton v-model="ceilingMode" value="auto" accent="brand">
            {{ t('firewall:limits:ceiling:auto') }}
          </UiRadioButton>
          <UiRadioButton v-model="ceilingMode" value="custom" accent="brand">
            {{ t('firewall:limits:ceiling:custom') }}
          </UiRadioButton>
          <UiRadioButton v-model="ceilingMode" value="off" accent="brand">
            {{ t('firewall:limits:ceiling:off') }}
          </UiRadioButton>
        </UiRadioButtonGroup>
        <VtsInputWrapper
          v-if="ceilingMode === 'custom'"
          :label="t('firewall:limits:ceiling:value')"
          :message="ceilingField.error"
          wrap-message
        >
          <UiInput
            v-model.number="form.maxConnPerVIF"
            :accent="ceilingField.error ? 'danger' : 'brand'"
            type="number"
            min="1"
            required
            @blur="ceilingField.onBlur()"
          />
        </VtsInputWrapper>

        <UiCheckbox v-model="meterOn" accent="brand">{{ t('firewall:limits:meter') }}</UiCheckbox>
        <UiInfo accent="muted" wrap>{{ t('firewall:limits:meter:info') }}</UiInfo>
        <VtsInputWrapper
          v-if="meterOn"
          :label="t('firewall:limits:meter:value')"
          :message="meterField.error"
          wrap-message
        >
          <UiInput
            v-model.number="form.newConnPerSec"
            :accent="meterField.error ? 'danger' : 'brand'"
            type="number"
            min="1"
            required
            @blur="meterField.onBlur()"
          />
        </VtsInputWrapper>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('firewall:save-to-draft') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import type { VdfLimits } from '@/modules/vdf/types.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import { withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

// agent semantics (agent/policy.go Limits): ceiling 0 = 10 % of the host's
// conntrack table, -1 = off; meter 0 or -1 = off
const { limits } = defineProps<{
  limits: VdfLimits | undefined
}>()

const emit = defineEmits<{
  confirm: [limits: VdfLimits | undefined]
  cancel: []
}>()

const { t } = useI18n()

const ceiling = limits?.maxConnPerVIF ?? 0

const ceilingMode = ref<'auto' | 'custom' | 'off'>(ceiling === 0 ? 'auto' : ceiling < 0 ? 'off' : 'custom')

const meterOn = ref((limits?.newConnPerSec ?? 0) > 0)

const form = reactive({
  maxConnPerVIF: ceiling > 0 ? ceiling : 10000,
  newConnPerSec: (limits?.newConnPerSec ?? 0) > 0 ? limits!.newConnPerSec! : 1000,
})

// a value of 0 or less means something else to the agent (auto, off):
// those are chosen with the modes, not typed
const { useField, validate } = useValidatedForm(form, {
  errors: {
    onBlur: () => ({
      maxConnPerVIF: positive(() => ceilingMode.value === 'custom'),
      newConnPerSec: positive(() => meterOn.value),
    }),
  },
})

function positive(isUsed: () => boolean) {
  return {
    positive: withMessage(
      (value: unknown) => !isUsed() || (Number.isInteger(value) && Number(value) >= 1),
      () => t('firewall:limits:positive')
    ),
  }
}

const ceilingField = useField('maxConnPerVIF')

const meterField = useField('newConnPerSec')

async function submit() {
  if (!(await validate())) {
    return
  }

  const next: VdfLimits = {}

  if (ceilingMode.value === 'custom') {
    next.maxConnPerVIF = form.maxConnPerVIF
  } else if (ceilingMode.value === 'off') {
    next.maxConnPerVIF = -1
  }

  if (meterOn.value) {
    next.newConnPerSec = form.newConnPerSec
  }

  emit('confirm', Object.keys(next).length === 0 ? undefined : next)
}
</script>

<style lang="postcss" scoped>
.vdf-limits-drawer {
  .fields {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
  }
}
</style>
