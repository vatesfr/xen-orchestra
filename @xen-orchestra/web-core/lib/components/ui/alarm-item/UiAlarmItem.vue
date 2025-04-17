<template>
  <div class="alarm-item">
    <div class="object-description">
      <UiButtonIcon :icon="faAngleRight" size="small" accent="brand" />
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
</template>

<script lang="ts" setup>
import { faAngleRight } from '@fortawesome/free-solid-svg-icons'
import { useTimeAgo } from '@vueuse/core'
import { computed } from 'vue'
import UiButtonIcon from '../button-icon/UiButtonIcon.vue'

const { date } = defineProps<{
  label: string
  value: string
  date: Date | number | string
}>()

defineSlots<{
  objectLink: any
}>()

const timeAgo = computed(() => useTimeAgo(date))
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

/* Modification pour cibler uniquement le texte dans object-time */
.object-time {
  gap: 0.6rem;
}

.object-time > :not(span) {
  color: var(--color-neutral-txt-secondary); /* Applique la couleur uniquement au texte */
}

.alarm-item {
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
