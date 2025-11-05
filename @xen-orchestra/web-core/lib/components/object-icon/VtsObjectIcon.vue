<template>
  <VtsIcon :name="iconName" :size />
</template>

<script generic="TType extends ObjectType, TState extends ObjectState<TType>" lang="ts" setup>
import VtsIcon, { type IconSize } from '@core/components/icon/VtsIcon.vue'
import type { ObjectIconName, ObjectState, ObjectType } from '@core/icons'
import { computed } from 'vue'

const { type, state } = defineProps<{
  type: TType
  state: TState
  size: IconSize
}>()

const iconName = computed(() => `object:${type}:${state}` as ObjectIconName)
</script>
