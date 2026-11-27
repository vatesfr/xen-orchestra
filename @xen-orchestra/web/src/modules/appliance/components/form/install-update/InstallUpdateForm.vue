<template>
  <div class="install-update-form">
    <UiTitle>{{ t('appliance:before-installing') }}</UiTitle>
    <FormRichCheckbox
      v-bind="snapshotCheckboxBindings"
      :description="t('appliance:snapshot-before-install-description')"
    >
      {{ t('appliance:snapshot-before-install') }}
      <template #tag>
        <UiTag accent="success" variant="secondary">{{ t('recommended') }}</UiTag>
      </template>
    </FormRichCheckbox>
  </div>
</template>

<script lang="ts" setup>
import { useInstallUpdateForm } from '@/modules/appliance/form/install-update/use-install-update-form.ts'
import FormRichCheckbox from '@/shared/components/form/FormRichCheckbox.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { snapshotCheckboxBindings, buildPayload } = useInstallUpdateForm()

defineExpose({
  validate: buildPayload,
})
</script>

<style lang="postcss" scoped>
.install-update-form {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
