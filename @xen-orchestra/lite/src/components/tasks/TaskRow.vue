<template>
  <tr :class="{ finished: !isPending }" class="finished-task-row">
    <td>{{ task.name_label }}</td>
    <td>
      <RouterLink
        v-if="host !== undefined"
        :to="{
          name: '/host/[uuid]/dashboard',
          params: { uuid: host.uuid },
        }"
      >
        {{ host.name_label }}
      </RouterLink>
    </td>
    <td>
      <UiProgressBar v-if="isPending" :fill-width accent="info" />
    </td>
    <td>
      <RelativeTime v-if="isPending" :date="createdAt" />
      <template v-else>{{ d(createdAt, 'datetime_short') }}</template>
    </td>
    <td>
      <template v-if="finishedAt !== undefined">
        {{ d(finishedAt, 'datetime_short') }}
      </template>
      <RelativeTime v-else-if="isPending && estimatedEndAt !== Infinity" :date="estimatedEndAt" />
    </td>
  </tr>
</template>

<script lang="ts" setup>
import RelativeTime from '@/components/RelativeTime.vue'
import { parseDateTime } from '@/libs/utils'
import type { XenApiTask } from '@/libs/xen-api/xen-api.types'
import { useHostStore } from '@/stores/xen-api/host.store'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import { useProgress } from '@core/packages/progress/use-progress.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { task, isPending } = defineProps<{
  isPending?: boolean
  task: XenApiTask
}>()

const { fillWidth } = useProgress(() => task.progress, 1)

const { d } = useI18n()

const { getByOpaqueRef: getHost } = useHostStore().subscribe()

const createdAt = computed(() => parseDateTime(task.created))

const host = computed(() => getHost(task.resident_on))

const estimatedEndAt = computed(() => createdAt.value + (new Date().getTime() - createdAt.value) / task.progress)

const finishedAt = computed(() => (isPending ? undefined : parseDateTime(task.finished)))
</script>

<style lang="postcss" scoped>
.finished {
  opacity: 0.5;
}
</style>
