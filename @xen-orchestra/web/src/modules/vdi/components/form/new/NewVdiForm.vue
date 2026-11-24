<template>
  <div class="vdi-new-form">
    <div class="new-form">
      <UiTitle>{{ t('general-information') }}</UiTitle>
      <VtsRequiredHint />

      <NewVdiSourceSelector v-model="source" />

      <div class="row">
        <VdiFormTextInput v-bind="nameInputBindings" />
        <FormTextarea v-bind="descriptionInputBindings" />
      </div>

      <div class="row">
        <VdiFormSelect v-bind="srSelectBindings">
          <template #option="{ option }">
            <VtsOption :option>
              <span class="sr-option-content">
                <VtsIcon v-if="option.properties.icon" :name="option.properties.icon" size="medium" />
                {{ option.properties.label }}
              </span>
            </VtsOption>
          </template>
        </VdiFormSelect>
        <NewVdiAllocatedSpaceInput v-bind="allocatedSpaceBindings" />
      </div>
    </div>

    <div class="new-form">
      <UiTitle>{{ t('options') }}</UiTitle>
      <UiCheckbox v-model="readOnly" accent="brand">
        {{ t('read-only') }}
      </UiCheckbox>
      <div>
        <UiCheckbox v-model="bootable" accent="brand" :disabled="!isPv">
          {{ t('bootable') }}
          <template #info>
            {{ t('pv-vms-only') }}
          </template>
        </UiCheckbox>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import VdiFormTextInput from '@/modules/vdi/components/form/new/inputs/VdiFormTextInput.vue'
import NewVdiAllocatedSpaceInput from '@/modules/vdi/components/form/new/NewVdiAllocatedSpaceInput.vue'
import NewVdiSourceSelector from '@/modules/vdi/components/form/new/NewVdiSourceSelector.vue'
import VdiFormSelect from '@/modules/vdi/components/form/shared/VdiFormSelect.vue'
import { useNewVdiForm } from '@/modules/vdi/form/new/use-new-vdi-form.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import FormTextarea from '@/shared/components/form/FormTextarea.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const {
  source,
  srSelectBindings,
  nameInputBindings,
  descriptionInputBindings,
  allocatedSpaceBindings,
  readOnly,
  bootable,
  isPv,
  validateAndBuildPayload,
} = useNewVdiForm(() => vm)

defineExpose({
  validate: validateAndBuildPayload,
})
</script>

<style lang="postcss" scoped>
.vdi-new-form {
  display: flex;
  flex-direction: column;
  gap: 4rem;

  .new-form {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
  }

  .row {
    display: flex;
    align-items: start;
    flex-direction: column;
    gap: 2.4rem;

    & > * {
      width: 100%;
      min-width: 0;
    }

    @media (--medium-or-large) {
      flex-direction: row;
    }
  }
}

.sr-option-content {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
