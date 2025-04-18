<!-- v1 -->
<template>
  <li class="ui-alarm-item" :class="className">
    <div class="content">
      <div class="label-value text-ellipsis">
        <UiButtonIcon
          v-if="alarm.description"
          :icon="isDescriptionVisible ? faAngleDown : faAngleRight"
          size="small"
          accent="brand"
          @click="toggleDescription()"
        />
        <span class="typo-body-regular text-ellipsis">
          {{ alarm.label }}
        </span>
        <span class="typo-body-regular value">
          {{ alarm.value }}
        </span>
      </div>
      <div class="typo-body-regular-small info">
        <div v-if="slots['object-link']" class="object-link">
          <span class="on-text">
            {{ $t('on-object') }}
          </span>
          <span class="descriptor">
            <slot name="object-link" />
          </span>
          <span class="divider" />
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
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { toVariants } from '@core/utils/to-variants.util'
import { faAngleDown, faAngleRight } from '@fortawesome/free-solid-svg-icons'
import { useTimeAgo, useToggle } from '@vueuse/core'
import { computed } from 'vue'

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
  'object-link'?(): any
}>()

const timeAgo = computed(() => useTimeAgo(alarm.date))

const className = computed(() =>
  toVariants({
    size,
  })
)

const [isDescriptionVisible, toggleDescription] = useToggle(false)
</script>

<style scoped lang="postcss">
.ui-alarm-item {
  &:not(:first-child) {
    border-block-start: none;
  }
  border-block: 0.1rem solid var(--color-neutral-border);
  .content {
    display: flex;
    justify-content: space-between;
    padding: 0.8rem 1.2rem;
    gap: 0.6rem;

    .label-value {
      gap: 1.6rem;
    }

    .info,
    .label-value,
    .object-link {
      display: flex;
      flex-direction: row;
      align-items: center;

      .value {
        color: var(--color-danger-txt-base);
      }
    }

    .info,
    .object-link {
      gap: 0.6rem;
      white-space: nowrap;

      .on-text {
        text-transform: capitalize;
      }
    }
    .divider::before {
      content: '•';
    }
  }

  .info > :not(.descriptor),
  .description {
    color: var(--color-neutral-txt-secondary);
  }

  &.size--large {
    .content {
      flex-direction: row;
    }

    .description {
      padding: 0.8rem 1.2rem;
    }
  }

  &.size--small {
    .content {
      flex-direction: column;
      gap: 0.8rem;
    }

    .description {
      padding: 0 1.2rem 0.4rem 1.2rem;
      gap: 0.4rem;
    }
  }
}
</style>
