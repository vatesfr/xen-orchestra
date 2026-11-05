<template>
  <VtsForm class="vdi-attach-form" @submit="onSubmit()">
    <div class="attach-form">
      <UiTitle>{{ t('general-information') }}</UiTitle>
      <div class="row">
        <VdiFormSelect v-bind="srSelectBindings">
          <template #option="{ option }">
            <VtsOption :option>
              <span class="select-option">
                <VtsIcon v-if="option.properties.icon" :name="option.properties.icon" size="medium" />
                {{ option.properties.label }}
              </span>
            </VtsOption>
          </template>
        </VdiFormSelect>
        <VdiFormSelect v-bind="vdiSelectBindings">
          <template #option="{ option }">
            <VtsOption :option>
              <span class="select-option">
                <VtsIcon v-if="option.properties.icon" :name="option.properties.icon" size="medium" />
                {{ option.properties.label }}
              </span>
            </VtsOption>
          </template>
        </VdiFormSelect>
      </div>
    </div>
    <div class="attach-form">
      <UiTitle>{{ t('options') }}</UiTitle>
      <div>
        <VdiFormCheckbox v-model="readOnly" :label="t('read-only')" :disabled="forceReadOnly">
          <template v-if="forceReadOnly" #info>{{ t('info:vdi-attached-rw') }}</template>
        </VdiFormCheckbox>
      </div>
      <div>
        <VdiFormCheckbox v-model="bootable" :label="t('bootable')" :disabled="!isPv">
          <template #info>{{ t('pv-vms-only') }}</template>
        </VdiFormCheckbox>
      </div>
    </div>
    <div class="buttons-container">
      <UiLink :to="cancelTo" size="medium">
        {{ t('cancel') }}
      </UiLink>
      <UiButton type="submit" size="medium" accent="brand" variant="primary">
        {{ t('action:attach') }}
      </UiButton>
    </div>
  </VtsForm>
</template>

<script lang="ts" setup>
import type { NewVbdPayload } from '@/modules/vbd/jobs/xo-vbd-create.job.ts'
import VdiFormCheckbox from '@/modules/vdi/components/form/attach/inputs/VdiFormCheckbox.vue'
import VdiFormSelect from '@/modules/vdi/components/form/shared/VdiFormSelect.vue'
import { useVdiAttachForm } from '@/modules/vdi/form/attach/use-vdi-attach-form.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsForm from '@core/components/form/VtsForm.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

const { vm } = defineProps<{
  vm: FrontXoVm
  cancelTo: RouteLocationRaw
}>()

const emit = defineEmits<{
  attach: [data: NewVbdPayload]
}>()

const { t } = useI18n()

const { srSelectBindings, vdiSelectBindings, readOnly, forceReadOnly, bootable, isPv, validateAndBuildPayload } =
  useVdiAttachForm(() => vm)

async function onSubmit() {
  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('attach', payload)
  }
}
</script>

<style lang="postcss" scoped>
.vdi-attach-form {
  display: flex;
  flex-direction: column;
  gap: 4rem;

  .attach-form {
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

.select-option {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
