<template>
  <UiPanelCard class="v2v-vm-options-card">
    <UiPanelCardTitle size="medium" :label="t('options')" />
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('keep-mac-addresses') }}</template>
        <template #value>
          <VtsStatus :status="keepMac" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('template') }}</template>
        <template #value>
          <V2vTargetValue :target="template" :options="templateOptions" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('tags') }}</template>
        <template #value>
          <UiTagsList v-if="tags.length > 0">
            <VtsTag v-for="tag of tags" :key="tag" :value="tag" />
          </UiTagsList>
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import V2vTargetValue from '@/modules/v2v/components/mapping/V2vTargetValue.vue'
import type { V2vResolvedTarget, V2vTargetOption } from '@/modules/v2v/types/v2v-mapping.type.ts'
import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  keepMac: boolean
  template: V2vResolvedTarget<FrontXoVmTemplate['id']>
  templateOptions: V2vTargetOption<FrontXoVmTemplate['id']>[]
  tags: string[]
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.v2v-vm-options-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
