<template>
  <NewVmSection :title="t('general-information')" class="new-vm-general-information-section">
    <div class="columns" :class="{ mobile: uiStore.isSmall }">
      <div class="column">
        <VtsInputWrapper :id="fieldIds.name" :label="t('new-vm:name')" :message="errorMessages.name">
          <UiInput v-model.trim="vmState.name" :accent="errors.name === undefined ? 'neutral' : 'danger'" required />
        </VtsInputWrapper>
        <VtsInputWrapper :label="t('boot-firmware')">
          <VtsSelect :id="bootFirmwareSelectId" accent="neutral" />
        </VtsInputWrapper>
        <div
          v-if="canCopyBiosStrings"
          v-tooltip="{
            placement: 'top-start',
            content: selectedTemplateHasBiosStrings ? t('template-has-bios-strings') : undefined,
          }"
        >
          <UiCheckbox v-model="vmState.copyHostBiosStrings" accent="brand" :disabled="selectedTemplateHasBiosStrings">
            {{ t('copy-host-bios-strings') }}
          </UiCheckbox>
        </div>
        <UiCheckboxGroup v-else accent="brand" vertical>
          <UiCheckbox v-model="vmState.createVtpm" accent="brand">
            {{ t('vtpm') }}
          </UiCheckbox>
          <UiCheckbox v-model="vmState.secureBoot" accent="brand">
            {{ t('secure-boot') }}
          </UiCheckbox>
        </UiCheckboxGroup>
      </div>
      <div class="column">
        <UiTextarea v-model="vmState.description" accent="neutral">
          {{ t('new-vm:description') }}
        </UiTextarea>
        <VtsInputWrapper :label="t('affinity-host')">
          <VtsSelect :id="affinityHostSelectId" accent="neutral" />
        </VtsInputWrapper>
        <VtsInputWrapper :label="t('high-availability')" :message="haMessages" wrap-message>
          <VtsSelect :id="haSelectId" accent="neutral" />
        </VtsInputWrapper>
      </div>
    </div>
  </NewVmSection>
</template>

<script lang="ts" setup>
import NewVmSection from '@/modules/vm/components/new/NewVmSection.vue'
import { useNewVmHighAvailability } from '@/modules/vm/composables/use-new-vm-high-availability.composable.ts'
import { useNewVmForm } from '@/modules/vm/form/new/use-new-vm-form.ts'
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiCheckboxGroup from '@core/components/ui/checkbox-group/UiCheckboxGroup.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useFormSelect } from '@core/packages/form-select'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

const BOOT_FIRMWARE_OPTIONS = ['bios', 'uefi']

const { t } = useI18n()

const uiStore = useUiStore()

const { vmState, hosts, canCopyBiosStrings, selectedTemplateHasBiosStrings, errors, errorMessages, fieldIds } =
  useNewVmForm()

const { haOptions, getHaLabel, haDescription } = useNewVmHighAvailability(() => vmState.highAvailability)

const haMessages = computed<InputWrapperMessage>(() => [
  haDescription.value,
  ...(vmState.pool?.HA_enabled === false
    ? [{ content: t('new-vm:ha-pool-disabled'), accent: 'warning' as const }]
    : []),
])

const { id: bootFirmwareSelectId } = useFormSelect(BOOT_FIRMWARE_OPTIONS, {
  model: toRef(vmState, 'bootFirmware'),
})

const { id: affinityHostSelectId } = useFormSelect(hosts, {
  model: toRef(vmState, 'affinity_host'),
  searchable: true,
  emptyOption: {
    label: t('select-host'),
    value: undefined,
  },
  option: {
    label: 'name_label',
    value: 'id',
  },
})

const { id: haSelectId } = useFormSelect(haOptions, {
  model: toRef(vmState, 'highAvailability'),
  option: {
    label: value => getHaLabel(value),
  },
})
</script>

<style lang="postcss" scoped>
.new-vm-general-information-section {
  .columns {
    display: flex;
    gap: 8rem;

    .column {
      display: flex;
      flex-direction: column;
      gap: 2.4rem;
      width: 40%;
    }

    &.mobile {
      flex-direction: column;
      gap: 2.4rem;

      .column {
        width: 100%;
      }
    }
  }
}
</style>
