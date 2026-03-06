<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('properties') }}
    </UiCardTitle>
    <div class="content">
      <VtsRecursiveFields :fields="propertiesOtherWithoutCloudConfig" />
    </div>
    <UiLogEntryViewer
      v-if="cloudConfig !== undefined"
      :content="cloudConfig"
      :label="t('cloud-config')"
      size="small"
      accent="info"
    />
    <UiLogEntryViewer :content="properties.other" :label="t('other-properties')" size="small" accent="info" />
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoTaskPropertiesUtils } from '@/modules/task/composables/xo-task-properties-utils.composable.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import VtsRecursiveFields from '@core/components/recursive-fields/VtsRecursiveFields.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { omit } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { task } = defineProps<{
  task: FrontXoTask
}>()

const { t } = useI18n()

const { properties } = useXoTaskPropertiesUtils(() => task)

const cloudConfig = computed(() => {
  const args = properties.value.other?.args as { cloud_config?: string } | undefined
  return args?.cloud_config
})

const propertiesOtherWithoutCloudConfig = computed(() =>
  properties.value.other?.args ? omit(properties.value.other.args, 'cloud_config') : undefined
)
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
