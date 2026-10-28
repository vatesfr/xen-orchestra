<template>
  <UiCard>
    <UiCardTitle>{{ t('options') }}</UiCardTitle>
    <UiCheckbox
      :model-value="keepMac"
      accent="brand"
      @update:model-value="value => emit('changeKeepMac', value === true)"
    >
      {{ t('keep-mac-addresses') }}
    </UiCheckbox>
    <VtsInputWrapper :label="t('template')">
      <div class="template">
        <V2vTargetSelect
          :model-value="template.value"
          :options="templateOptions"
          :loading
          @update:model-value="templateId => emit('changeTemplate', templateId)"
        />
        <V2vValueOrigin :origin="template.origin" @reset="emit('changeTemplate', undefined)" />
      </div>
    </VtsInputWrapper>
    <VtsInputWrapper
      :label="t('tags')"
      :message="{ content: t('v2v:tags-backup-info', { tag: V2V_PARTIAL_IMPORT_TAG }), accent: 'info' }"
      wrap-message
    >
      <VtsTagsInput :model-value="tags" accent="brand" @update:model-value="value => emit('changeTags', value)" />
    </VtsInputWrapper>
  </UiCard>
</template>

<script lang="ts" setup>
import V2vTargetSelect from '@/modules/v2v/components/mapping/V2vTargetSelect.vue'
import V2vValueOrigin from '@/modules/v2v/components/mapping/V2vValueOrigin.vue'
import type { V2vResolvedTarget, V2vTargetOption } from '@/modules/v2v/types/v2v-mapping.type.ts'
import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsTagsInput from '@core/components/tags-input/VtsTagsInput.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import { V2V_PARTIAL_IMPORT_TAG } from '@vates/types'
import { useI18n } from 'vue-i18n'

defineProps<{
  keepMac: boolean
  template: V2vResolvedTarget<FrontXoVmTemplate['id']>
  templateOptions: V2vTargetOption<FrontXoVmTemplate['id']>[]
  tags: string[]
  loading: boolean
}>()

const emit = defineEmits<{
  changeKeepMac: [value: boolean]
  changeTemplate: [templateId: FrontXoVmTemplate['id'] | undefined]
  changeTags: [tags: string[]]
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.template {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.8rem;
}
</style>
