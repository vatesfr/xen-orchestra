<template>
  <UiCard class="card-container">
    <UiCardTitle>
      <UiLink v-if="task.properties.name !== undefined" size="small" icon="fa:bars-progress">
        {{ task.properties.name }}
      </UiLink>
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('id') }}</template>
        <template #value>{{ task.id }}</template>
        <template #addons>
          <VtsCopyButton :value="task.id" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('task.type') }}</template>
        <template #value>
          <UiTagsList>
            <UiTag accent="info" variant="secondary">
              {{ task.properties.type }}
            </UiTag>
          </UiTagsList>
        </template>
        <template v-if="task.properties.type !== undefined" #addons>
          <VtsCopyButton :value="task.properties.type" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('by') }}</template>
        <template v-if="user" #value>
          <UiAccountMenuButton size="extra-small" />
          {{ user.name }}
        </template>
        <template v-if="user && user.name" #addons>
          <VtsCopyButton :value="user.name" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('task.started') }}</template>
        <template #value>{{ taskStart }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ task.status === 'pending' ? t('task.estimated-end') : t('task.ended') }}</template>
        <template #value>
          {{ taskEnd }}
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('status') }}</template>
        <template #value>
          <UiTagsList>
            <UiTag :accent="taskStatus" variant="secondary">
              {{ task.status }}
            </UiTag>
          </UiTagsList>
        </template>
        <template v-if="task.properties.progress" #addons>
          <UiCircleProgressBar :accent="progressStatus" size="small" :value="task.properties.progress" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoUserCollection } from '@/remote-resources/use-xo-user.ts'
import type { XoTask } from '@/types/xo/task.type.ts'
import { getTaskAccent } from '@/utils/task-status.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiAccountMenuButton from '@core/components/ui/account-menu-button/UiAccountMenuButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCircleProgressBar from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { task } = defineProps<{
  task: XoTask
}>()

const { t, d } = useI18n()

const { useGetUserById } = useXoUserCollection()

const user = useGetUserById(() => task.properties.userId)

const progressStatus = computed(() => getTaskAccent(task.status, 'progress'))
const taskStatus = computed(() => getTaskAccent(task.status, 'status'))

const taskStart = computed(() => d(task.start, 'datetime_short'))

const taskEnd = computed(() => {
  if (task.end) {
    return d(task.end, 'datetime_short')
  }

  const progress = task.properties.progress

  if (!progress) {
    return '-'
  }

  // TODO need to be improved and test with real data...
  const elapsed = Date.now() - task.start
  const estimatedTotal = elapsed / progress
  const endTimestamp = task.start + estimatedTotal

  return d(endTimestamp, 'datetime_short')
})
</script>

<style scoped lang="postcss">
.card-container {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
