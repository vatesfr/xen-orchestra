<template>
  <VtsForm class="vdi-migrate-form" @submit="onSubmit()">
    <UiTitle>{{ t('general-information') }}</UiTitle>
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
  </VtsForm>
</template>

<script lang="ts" setup>
import VdiFormSelect from '@/modules/vdi/components/form/shared/VdiFormSelect.vue'
import { useVdiMigrateForm } from '@/modules/vdi/form/migrate/use-vdi-migrate-form.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import VtsForm from '@core/components/form/VtsForm.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { vdi } = defineProps<{
  vdi: FrontXoVdi
}>()

const emit = defineEmits<{
  confirm: [srId: string]
}>()

const { t } = useI18n()

const { srSelectBindings, requiresForceMigrate, validateAndGetSrId } = useVdiMigrateForm(() => vdi)

async function onSubmit() {
  const srId = await validateAndGetSrId()

  if (srId !== undefined) {
    emit('confirm', srId)
  }
}

defineExpose({
  submit: onSubmit,
  requiresForceMigrate,
})
</script>

<style lang="postcss" scoped>
.vdi-migrate-form {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  text-align: left;
}

.select-option {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
