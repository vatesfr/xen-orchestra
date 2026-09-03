<template>
  <NewSrFormSelect v-bind="props">
    <template #option="{ option }">
      <VtsDropdownTitle
        v-if="option.properties.isFirstInGroup && option.properties.group"
        :icon="option.properties.icon"
      >
        {{ groupLabels[option.properties.group] }}
      </VtsDropdownTitle>
      <VtsOption :option />
    </template>
  </NewSrFormSelect>
</template>

<script lang="ts" setup>
import NewSrFormSelect from '@/modules/storage-repository/components/form/new/inputs/NewSrFormSelect.vue'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { FormSelectId } from '@core/packages/form-select'
import VtsDropdownTitle from '@core/components/dropdown/VtsDropdownTitle.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import { SR_CONTENT_GROUP, type SrContentGroup } from '@core/types/storage-repository.type.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  id: FormSelectId
  label: string
  required?: boolean
  info?: string
  warning?: InputWrapperMessage
  error?: InputWrapperMessage
}>()

const { t } = useI18n()

const groupLabels = computed<Record<SrContentGroup, string>>(() => ({
  [SR_CONTENT_GROUP.VDI]: t('sr-group-vdi'),
  [SR_CONTENT_GROUP.ISO]: t('sr-group-iso'),
}))
</script>
