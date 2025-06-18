<template>
  <NewVtsIcon :name="iconName" :size />
</template>

<script generic="TType extends ObjectIconType" lang="ts" setup>
import NewVtsIcon, { type IconSize } from '@core/components/icon/NewVtsIcon.vue'
import type { ObjectIconName } from '@core/icons'
import { computed } from 'vue'

export type ObjectIconType = ObjectIconName extends `object:${infer TType}:${string}` ? TType : never

export type ObjectIconState<TType extends ObjectIconType> =
  Extract<ObjectIconName, `object:${TType}:${string}`> extends `object:${TType}:${infer TState}` ? TState : never

const { type, state } = defineProps<{
  type: TType
  state: ObjectIconState<TType>
  size: IconSize
}>()

const iconName = computed(() => `object:${type}:${state}` as ObjectIconName)
</script>
