# Example

```vue-template
<div class="ui-task-item">
    <div v-if="task.name" v-tooltip class="text-ellipsis typo-body-regular">
      {{ task.name }}
    </div>
    <div class="container">
      <div class="content">
        <UiTag v-if="task.tag" accent="neutral" variant="primary" size="medium">
          {{ task.tag }}
        </UiTag>
        <div v-if="task.subtasks" class="subtasks">
          <VtsIcon accent="current" class="icon" :icon="faCircleNotch" />
          <p class="typo-form-info text-ellipsis">
            {{ t('tasks.n-subtasks', { n: subtasks }) }}
          </p>
        </div>
        <UiInfo v-for="(item, index) in messageTypes" :key="index" v-tooltip :accent="item.type as any">
          {{ item.message }}
        </UiInfo>
      </div>
      <div class="content">
        <div class="user typo-body-regular-small">
          <div v-if="user" v-tooltip class="user-name text-ellipsis">
            <span>{{ t('by') }}</span>
            <UiUserLink :username="user" />
          </div>
          <span v-if="taskIsComplete" class="text-ellipsis">
            {{ $t('task.finished') }}
            <RelativeTime v-if="task.end" :date="task.end" />
          </span>
          <span v-else class="text-ellipsis">
            {{ $t('task.started') }}
            <RelativeTime v-if="task.start" :date="task.start" />
          </span>
        </div>
        <div class="progress-circle-bar">
          <UiCircleProgressBar
            v-if="circleProgress"
            :accent="getEffectiveStatus"
            size="small"
            :value="circleProgress"
          />
        </div>
      </div>
    </div>
  </div>
```

```vue-script
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import RelativeTime from '@core/components/relative-time/RelativeTime.vue'
import UiCircleProgressBar, {
  type CircleProgressBarAccent,
} from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiUserLink from '@core/components/ui/user-link/UiUserLink.vue'
import { useMapper } from '@core/composables/mapper.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { Message, Task, TaskStatus } from '@core/types/task.type.ts'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
```
