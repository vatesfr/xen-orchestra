<template>
  <VtsDrawer dismissible is-open @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:export-n-vms', 1) }}
    </template>

    <template #content>
      <div class="form">
        <p class="section-title">{{ t('general-information') }}</p>

        <!-- Type -->
        <div class="field">
          <UiLabel accent="neutral" required>{{ t('type') }}</UiLabel>
          <div class="radio-group">
            <!-- eslint-disable-next-line @intlify/vue-i18n/no-raw-text -->
            <UiRadioButton v-model="type" accent="brand" value="xva">XVA</UiRadioButton>
            <!-- eslint-disable-next-line @intlify/vue-i18n/no-raw-text -->
            <UiRadioButton v-model="type" accent="brand" value="ova">OVA</UiRadioButton>
          </div>
        </div>

        <!-- Compression: only available for XVA -->
        <template v-if="type === 'xva'">
          <p class="section-title">{{ t('options') }}</p>
          <div class="field">
            <UiLabel accent="neutral" required>{{ t('compression') }}</UiLabel>
            <div class="radio-group">
              <UiRadioButton v-model="compression" accent="brand" value="none">
                {{ t('disabled') }}
              </UiRadioButton>
              <!-- eslint-disable-next-line @intlify/vue-i18n/no-raw-text -->
              <UiRadioButton v-model="compression" accent="brand" value="gzip">GZIP</UiRadioButton>
              <!-- eslint-disable-next-line @intlify/vue-i18n/no-raw-text -->
              <UiRadioButton v-model="compression" accent="brand" value="zstd">ZSTD</UiRadioButton>
            </div>
          </div>
        </template>
      </div>
    </template>

    <template #buttons>
      <VtsDrawerCancelButton />
      <VtsDrawerConfirmButton :on-click="handleConfirm">{{ t('action:export') }}</VtsDrawerConfirmButton>
    </template>
  </VtsDrawer>
</template>

<script lang="ts" setup>
import VtsDrawer from '@core/components/drawer/VtsDrawer.vue'
import VtsDrawerCancelButton from '@core/components/drawer/VtsDrawerCancelButton.vue'
import VtsDrawerConfirmButton from '@core/components/drawer/VtsDrawerConfirmButton.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type VmExportFormValues = {
  type: 'xva' | 'ova'
  compression: 'none' | 'gzip' | 'zstd'
}

const emit = defineEmits<{
  confirm: [values: VmExportFormValues]
  cancel: []
}>()

const { t } = useI18n()

const type = ref<string>('xva')
const compression = ref<string>('none')

watch(type, newType => {
  if (newType === 'ova') {
    compression.value = 'none'
  }
})

function handleConfirm() {
  emit('confirm', {
    type: type.value as VmExportFormValues['type'],
    compression: compression.value as VmExportFormValues['compression'],
  })
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

.radio-group {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1.6rem;
}
</style>
