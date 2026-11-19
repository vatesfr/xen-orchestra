<template>
  <FormSelect v-bind="props">
    <template #option="{ option }">
      <VtsDropdownTitle v-if="option.properties.isFirstInGroup" :icon="option.properties.icon">
        {{ groupLabels[option.properties.group] }}
      </VtsDropdownTitle>
      <VtsOption :option />
    </template>
  </FormSelect>
</template>

<script lang="ts" setup>
import { SR_CONTENT_GROUP, type SrContentGroup } from '@/modules/storage-repository/types/xo-sr-create.type.ts'
import FormSelect from '@/shared/components/form/FormSelect.vue'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { IconName } from '@core/icons'
import type { FormSelectId } from '@core/packages/form-select'
import VtsDropdownTitle from '@core/components/dropdown/VtsDropdownTitle.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type NewSrTypeOptionProperties = {
  icon: IconName
  group: SrContentGroup
  isFirstInGroup: boolean
}

const props = defineProps<{
  id: FormSelectId<NewSrTypeOptionProperties>
  label: string
  warning?: InputWrapperMessage
  error?: InputWrapperMessage
}>()

const { t } = useI18n()

const groupLabels = computed<Record<SrContentGroup, string>>(() => ({
  [SR_CONTENT_GROUP.VDI]: t('sr-group-vdi'),
  [SR_CONTENT_GROUP.ISO]: t('sr-group-iso'),
}))
</script>
