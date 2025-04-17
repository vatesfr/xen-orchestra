<template>
  <UiButtonIcon :icon="faAngleRight" size="small" accent="brand" />
  <div class="typo-body-regular">
    {{ label }}
  </div>
  <div class="typo-body-regular value">
    {{ value }}
  </div>
  <div class="typo-body-regular-small object">
    {{ $t('on-object') }}
    <slot name="objectLink" />
  </div>
  <div class="typo-body-regular-small time-ago">
    {{ timeAgo }}
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
</style>
