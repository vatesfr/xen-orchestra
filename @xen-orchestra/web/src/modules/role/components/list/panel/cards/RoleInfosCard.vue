<template>
  <UiPanelCard class="role-infos-card">
    <UiPanelCardTitle :id="role.id" size="medium" :label="role.name" icon="fa:key" />
    <div class="content">
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('description') }}</template>
        <template #value>{{ role.description }}</template>
        <template v-if="role.description" #addons>
          <VtsCopyButton :value="role.description" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  role: FrontXoRole
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.role-infos-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
