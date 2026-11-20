<template>
  <div class="vdi-attach-form">
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
        <FormCheckbox
          v-model="readOnly"
          :label="t('read-only')"
          :info="forceReadOnly ? t('info:vdi-attached-rw') : undefined"
          :disabled="forceReadOnly"
        />
      </div>
      <div>
        <FormCheckbox v-model="bootable" :label="t('bootable')" :info="t('pv-vms-only')" :disabled="!isPv" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import VdiFormSelect from '@/modules/vdi/components/form/shared/VdiFormSelect.vue'
import { useVdiAttachForm } from '@/modules/vdi/form/attach/use-vdi-attach-form.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import FormCheckbox from '@/shared/components/form/FormCheckbox.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { srSelectBindings, vdiSelectBindings, readOnly, forceReadOnly, bootable, isPv, validateAndBuildPayload } =
  useVdiAttachForm(() => vm)

defineExpose({
  validate: validateAndBuildPayload,
})
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
    }
  }
}

.select-option {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
