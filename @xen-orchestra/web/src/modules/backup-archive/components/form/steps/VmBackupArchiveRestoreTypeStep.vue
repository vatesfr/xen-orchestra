<template>
  <div class="vm-backup-archive-restore-type-step">
    <UiLabel accent="neutral" required>{{ t('restore-type') }}</UiLabel>
    <UiRichRadioButtonGroup v-for="group of groups" :key="group.label" accent="brand" vertical>
      <template #label>
        <UiGroupSubcategory>
          {{ group.label }}
          <template #info>{{ group.info }}</template>
        </UiGroupSubcategory>
      </template>
      <UiRichRadioButton
        v-for="option of group.options"
        :key="option.value"
        v-model="model"
        accent="brand"
        :value="option.value"
        :icon="option.icon"
        :disabled="option.disabled"
      >
        {{ option.label }}
        <template v-if="option.tag !== undefined" #tag>
          <UiTag :accent="option.tag.accent" :variant="option.tag.variant">{{ option.tag.label }}</UiTag>
        </template>
        <template #description>
          {{ option.description }}
          <span v-if="option.disabledReason !== undefined" class="disabled-reason">
            <VtsIcon name="fa:lock" size="small" />
            {{ option.disabledReason }}
          </span>
        </template>
      </UiRichRadioButton>
    </UiRichRadioButtonGroup>
    <UiInfo v-if="errorMessage !== undefined" accent="danger" wrap>{{ errorMessage }}</UiInfo>
  </div>
</template>

<script lang="ts" setup>
import type {
  VmBackupArchiveRestoreType,
  VmBackupArchiveRestoreTypeGroup,
} from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-form.ts'
import { formatErrorMessage } from '@/modules/backup-job/utils/backup-job-error-message.util.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiGroupSubcategory from '@core/components/ui/group-subcategory/UiGroupSubcategory.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiRichRadioButton from '@core/components/ui/rich-radio-button/UiRichRadioButton.vue'
import UiRichRadioButtonGroup from '@core/components/ui/rich-radio-button-group/UiRichRadioButtonGroup.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { error } = defineProps<{
  groups: VmBackupArchiveRestoreTypeGroup[]
  error?: InputWrapperMessage
}>()

const model = defineModel<VmBackupArchiveRestoreType | undefined>({ required: true })

const { t } = useI18n()

const errorMessage = computed(() => formatErrorMessage(error))
</script>

<style lang="postcss" scoped>
.vm-backup-archive-restore-type-step {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .disabled-reason {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
