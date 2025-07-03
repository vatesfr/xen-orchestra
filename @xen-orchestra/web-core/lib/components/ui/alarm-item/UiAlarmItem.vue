<!-- v1 -->
<template>
  <li class="ui-alarm-item" :class="className">
    <div class="content">
      <div class="title-progress text-ellipsis">
        <UiButtonIcon
          v-if="alarm.description"
          :icon="isDescriptionVisible ? faAngleDown : faAngleRight"
          size="small"
          accent="brand"
          :target-scale="2"
          @click="toggleDescription()"
        />
        <span v-tooltip class="typo-body-regular text-ellipsis">
          {{ alarm.label }}
        </span>
        <span class="typo-body-regular value">
          {{ alarm.value }}
        </span>
      </div>
      <div class="typo-body-regular-small info">
        <div v-if="slots.link" class="object-link">
          {{ t('on-object') }}
          <span class="descriptor">
            <slot name="link" />
          </span>
          <span class="interpunct" />
        </div>
        <span class="typo-body-regular-small">
          {{ timeAgo }}
        </span>
      </div>
    </div>
    <div v-if="isDescriptionVisible" class="description">
      {{ alarm.description }}
    </div>
  </li>
</template>

<script lang="ts" setup>
import { vTooltip } from '@core/directives/tooltip.directive'
import { toVariants } from '@core/utils/to-variants.util'
import { faAngleDown, faAngleRight } from '@fortawesome/free-solid-svg-icons'
import { useTimeAgo, useToggle } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiButtonIcon from '../button-icon/UiButtonIcon.vue'

type Alarm = {
  label: string
  value: string
  date: Date | number | string
  description?: string
}

const { alarm, size } = defineProps<{
  alarm: Alarm
  size: 'small' | 'large'
}>()

const slots = defineSlots<{
  link?(): any
}>()

const timeAgo = useTimeAgo(alarm.date)
const { t } = useI18n()

const className = computed(() =>
  toVariants({
    size,
  })
)

const [isDescriptionVisible, toggleDescription] = useToggle(false)
</script>

<style scoped lang="postcss">
.ui-alarm-item {
  display: flex;
  flex-direction: column;
  padding: 0.8rem 1.2rem;
  border-block: 0.1rem solid var(--color-neutral-border);
  color: var(--color-neutral-txt-primary);

  &:not(:first-child) {
    border-block-start: none;
  }

  .content {
    display: flex;
    justify-content: space-between;
    gap: 0.6rem;
  }

  .title-progress {
    gap: 1.6rem;
  }

  .info,
  .object-link,
  .title-progress {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .value {
    color: var(--color-danger-txt-base);
  }

  .info,
  .object-link {
    gap: 0.8rem;
    white-space: nowrap;
  }

  .interpunct::before {
    content: '•';
  }

  .info > :not(.descriptor),
  .description {
    color: var(--color-neutral-txt-secondary);
  }

  &.size--large {
    gap: 0.8rem;

    .content {
      flex-direction: row;
    }
  }

  &.size--small {
    gap: 0.4rem;

    .content {
      flex-direction: column;
    }
  }
}
</style>
