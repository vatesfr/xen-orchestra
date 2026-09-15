<template>
  <VtsIcon :name="iconName" :size :busy :busy-tooltip />
</template>

<script generic="TType extends ObjectType, TState extends ObjectState<TType>" lang="ts" setup>
import VtsIcon, { type IconSize } from '@core/components/icon/VtsIcon.vue'
import { icon, objectIcon, type ObjectState, type ObjectType } from '@core/icons'
import { computed } from 'vue'

const { type, state } = defineProps<{
  type: TType
  state?: TState
  size: IconSize
  busy?: boolean
  busyTooltip?: string
}>()

const iconName = computed(() => (state ? objectIcon(type, state) : icon(`object:${type}`)))
</script>
