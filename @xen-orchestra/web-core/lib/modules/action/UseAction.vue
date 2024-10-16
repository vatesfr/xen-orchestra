<template>
  <slot :is-busy :run />
</template>

<script generic="THandler extends (...args: any[]) => any" lang="ts" setup>
import { useAction } from '@core/modules/action/use-action'
import { toRef } from 'vue'

const props = defineProps<{
  onRun: THandler
  onSuccess?: (result: ReturnType<THandler>) => void
  onError?: (error: any) => void
}>()

const { run, isBusy } = useAction({
  handler: toRef(props, 'onRun'),
  onSuccess: toRef(props, 'onSuccess'),
  onError: toRef(props, 'onError'),
})
</script>
