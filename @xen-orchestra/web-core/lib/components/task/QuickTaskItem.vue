<template>
  <li class="vts-quick-task-item">
    <div v-if="hasSubTasks" class="toggle" @click="toggleExpand()">
      <ButtonIcon :icon="isExpanded ? faAngleDown : faAngleRight" size="small" />
    </div>
    <div class="content">
      <div class="typo p1-medium">
        {{ name }}
      </div>
      <div class="informations">
        <div class="line-1">
          <UiTag v-if="tag" color="grey">{{ tag }}</UiTag>
          <div v-if="hasSubTasks" class="subtasks">
            <UiIcon :icon="faCircleNotch" />
            <span class="typo p4-medium">{{ $t('tasks.n-subtasks', { n: subTasksCount }) }}</span>
          </div>
        </div>
        <div v-if="start" class="line-2 typo p4-regular">
          {{ $d(start, 'datetime_short') }}
          <template v-if="end">
            <UiIcon :icon="faArrowRight" />
            {{ $d(new Date(end), 'datetime_short') }}
          </template>
        </div>
      </div>
      <QuickTaskList v-if="hasSubTasks && isExpanded" :tasks="subTasks" sublist />
    </div>
  </li>
</template>

<script lang="ts" setup>
import ButtonIcon from '@core/components/button/ButtonIcon.vue'
import UiIcon from '@core/components/icon/UiIcon.vue'
import QuickTaskList from '@core/components/task/QuickTaskList.vue'
import UiTag from '@core/components/UiTag.vue'
import type { Task } from '@core/types/task.type'
import { faAngleDown, faAngleRight, faArrowRight, faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { useToggle } from '@vueuse/core'
import { computed } from 'vue'

const props = defineProps<{
  name: string
  start?: number
  end?: number
  tag?: string
  subtasks?: Task[]
}>()

const [isExpanded, toggleExpand] = useToggle()

const subTasks = computed(() => props.subtasks ?? [])
const subTasksCount = computed(() => subTasks.value.length)
const hasSubTasks = computed(() => subTasksCount.value > 0)
</script>

<style lang="postcss" scoped>
.vts-quick-task-item {
  display: flex;

  &:not(:last-child) {
    border-bottom: 1px solid var(--color-grey-500);
  }
}

.toggle {
  padding: 0.4rem 0;
}

.content {
  flex: 1;
  padding: 0.4rem 0.4rem 0.4rem 0.8rem;
}

.informations {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.line-1 {
  display: flex;
  align-items: center;
  gap: 0.2rem 0.8rem;
}

.line-2 {
  color: var(--color-grey-200);
}

.subtasks {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
</style>
