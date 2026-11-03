<template>
  <UiCard>
    <UiCardTitle>{{ t('options') }}</UiCardTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('keep-mac-addresses')">
        <template #value>
          <VtsStatus :status="keepMac" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('template')">
        <template #value>
          <div class="template">
            {{ templateName }}
            <V2vValueOrigin :origin="template.origin" readonly />
          </div>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('tags')">
        <template #value>
          <UiTagsList v-if="tags.length > 0">
            <VtsTag v-for="tag of tags" :key="tag" :value="tag" />
          </UiTagsList>
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script lang="ts" setup>
import V2vValueOrigin from '@/modules/v2v/components/mapping/V2vValueOrigin.vue'
import type { V2vResolvedTarget, V2vTargetOption } from '@/modules/v2v/types/v2v-mapping.type.ts'
import { getV2vTargetOptionLabel } from '@/modules/v2v/utils/v2v-mapping.util.ts'
import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { template, templateOptions } = defineProps<{
  keepMac: boolean
  template: V2vResolvedTarget<FrontXoVmTemplate['id']>
  templateOptions: V2vTargetOption<FrontXoVmTemplate['id']>[]
  tags: string[]
}>()

const { t } = useI18n()

const templateName = computed(() => getV2vTargetOptionLabel(templateOptions, template.value))
</script>

<style lang="postcss" scoped>
.template {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.8rem;
}
</style>
