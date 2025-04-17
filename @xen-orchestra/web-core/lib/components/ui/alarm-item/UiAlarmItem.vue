<template>
  <div class="alarm-item">
    <div class="object-description">
      <UiButtonIcon
        :icon="isDescriptionVisible ? faAngleDown : faAngleRight"
        size="small"
        accent="brand"
        @click="toggleDescription()"
      />
      <div class="typo-body-regular text-ellipsis">
        {{ label }}
      </div>
      <div class="typo-body-regular value">
        {{ value }}
      </div>
    </div>
    <div class="typo-body-regular-small object-time">
      {{ $t('on-object') }}
      <span>
        <slot name="objectLink" />
      </span>
      <div class="divider" />
      <div class="typo-body-regular-small">
        {{ timeAgo }}
      </div>
    </div>
  </div>
  <div v-if="isDescriptionVisible" class="alarm-description">
    {{ description }}
  </div>
</template>

<script lang="ts" setup>
import { faAngleDown, faAngleRight } from '@fortawesome/free-solid-svg-icons'
import { useTimeAgo, useToggle } from '@vueuse/core'
import { computed } from 'vue'
import UiButtonIcon from '../button-icon/UiButtonIcon.vue'

const { date } = defineProps<{
  label: string
  value: string
  date: Date | number | string
  description: string
}>()

defineSlots<{
  objectLink: any
}>()

const timeAgo = computed(() => useTimeAgo(date))
const [isDescriptionVisible, toggleDescription] = useToggle(false)
</script>

<style scoped lang="postcss">
.value {
  color: var(--color-danger-txt-base);
}

.alarm-item,
.object-time,
.object-description {
  display: flex;
  flex-direction: row;
  min-width: max-content;
}

.object-time {
  gap: 0.6rem;
}

.object-time > :not(span),
.alarm-description {
  color: var(--color-neutral-txt-secondary);
}

.alarm-item,
.alarm-description {
  display: flex;
  justify-content: space-between;
  padding: 0.8rem 1.2rem;
}

.object-description {
  gap: 1.6rem;
}

.divider::before {
  content: '•';
}
</style>
