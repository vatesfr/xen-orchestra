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
        <template #key>{{ t('task:type') }}</template>
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
          <div class="user">
            <UiUserLogo size="extra-small" />
            {{ user.name }}
          </div>
        </template>
        <template v-if="user && user.name" #addons>
          <VtsCopyButton :value="user.name" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('task:started') }}</template>
        <template #value>{{ formattedStartDate }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ task.status === 'pending' ? t('estimated-end') : t('task:ended') }}</template>
        <template #value>
          {{ formattedEndDate }}
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
        <template v-if="task.status" #addons>
          <UiCircleProgressBar :accent="progressStatus" size="small" :value="task.properties.progress ?? 100" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoUserResource } from '@/remote-resources/use-xo-user.ts'
import { getTaskAccents } from '@/utils/xo-records/task.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCircleProgressBar from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiUserLogo from '@core/components/ui/user-logo/UiUserLogo.vue'
import type { XoTask } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { task } = defineProps<{
  task: XoTask
}>()

const { t, d } = useI18n()

const { user } = useXoUserResource({}, () => task.properties.userId)

const progressStatus = computed(() => getTaskAccents(task.status).progressAccent)

const taskStatus = computed(() => getTaskAccents(task.status).statusAccent)

const formattedStartDate = computed(() => d(task.start, { dateStyle: 'short', timeStyle: 'medium' }))
const formattedEndDate = computed(() => {
  if (task.end) {
    return d(task.end, { dateStyle: 'short', timeStyle: 'medium' })
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

    .user {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }
  }
}
</style>
