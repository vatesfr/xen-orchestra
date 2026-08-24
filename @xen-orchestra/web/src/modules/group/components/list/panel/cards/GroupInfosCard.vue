<template>
  <UiPanelCard class="group-infos-card">
    <UiPanelCardTitle :id="group.id" size="medium" :label="group.name" icon="table:group" />
    <div class="content">
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('provider') }}</template>
        <template #value>{{ group.provider }}</template>
        <template v-if="group.provider" #addons>
          <VtsCopyButton :value="group.provider" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  group: FrontXoGroup
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.group-infos-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
