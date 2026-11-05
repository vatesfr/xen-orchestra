<template>
  <VtsForm class="vdi-new-form" @submit="onSubmit()">
    <div class="new-form">
      <UiTitle>{{ t('general-information') }}</UiTitle>

      <NewVdiSourceSelector v-model="source" />

      <div class="row">
        <VdiFormTextInput v-bind="nameInputBindings" />
        <VdiFormTextarea v-bind="descriptionInputBindings" />
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

    <div class="buttons-container">
      <UiLink :to="cancelTo" size="medium">{{ t('cancel') }}</UiLink>
      <UiButton type="submit" size="medium" accent="brand" variant="primary">
        {{ t('action:create') }}
      </UiButton>
    </div>
  </VtsForm>
</template>

<script lang="ts" setup>
import VdiFormTextInput from '@/modules/vdi/components/form/new/inputs/VdiFormTextInput.vue'
import NewVdiAllocatedSpaceInput from '@/modules/vdi/components/form/new/NewVdiAllocatedSpaceInput.vue'
import NewVdiSourceSelector from '@/modules/vdi/components/form/new/NewVdiSourceSelector.vue'
import VdiFormSelect from '@/modules/vdi/components/form/shared/VdiFormSelect.vue'
import { useNewVdiForm } from '@/modules/vdi/form/new/use-new-vdi-form.ts'
import type { NewVdiPayload } from '@/modules/vdi/jobs/xo-vdi-create.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsForm from '@core/components/form/VtsForm.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'
import VdiFormTextarea from './inputs/VdiFormTextarea.vue'

const { vm } = defineProps<{
  vm: FrontXoVm
  cancelTo: RouteLocationRaw
}>()

const emit = defineEmits<{
  create: [data: NewVdiPayload]
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

async function onSubmit() {
  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('create', payload)
  }
}
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
      gap: 8rem;
      max-width: 88rem;
    }
  }

  .buttons-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2.4rem;
  }
}

.sr-option-content {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
