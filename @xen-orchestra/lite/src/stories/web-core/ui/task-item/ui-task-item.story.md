# Example

```vue-template
  <div class="ui-task-item">
    <div class="content">
      <div class="left-side text-ellipsis">
        <div v-tooltip class="text-ellipsis typo-body-regular">
          {{ task.name }}
        </div>
        <UiTag v-if="task.tag" accent="neutral" variant="primary" size="medium">
          {{ task.tag }}
        </UiTag>
        <div class="info">
          <div v-if="task.subtasks" class="subtasks">
            <VtsIcon accent="current" class="icon" :icon="faCircleNotch" />
            <p class="typo-form-info text-ellipsis">
              {{ t('tasks.n-subtasks', { n: subtasks }) }}
            </p>
          </div>
          <UiInfo v-for="(item, index) in messageTypes" :key="index" v-tooltip :accent="item.type">
            {{ item.message }}
          </UiInfo>
        </div>
      </div>
      <div class="right-side">
        <div class="user typo-body-regular-small">
          <div v-if="user" class="user-name">
            <span>{{ t('by') }}</span>
            <UiUserLink :username="user" />
          </div>
          <span>{{ taskElapsedMessage }}</span>
          <span v-if="task.progress && !taskIsComplete"
            >{{ t('task.estimated-end-in', { time: remainingTime }) }}
          </span>
          <div>
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
  </div>
```

```vue-script
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiCircleProgressBar, {
  type CircleProgressBarAccent,
} from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiUserLink from '@core/components/ui/user-link/UiUserLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { Task } from '@core/types/task.type.ts'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
```
