<template>
  <div class="v2v-target-value">
    {{ label }}
    <V2vValueOrigin :origin="target.origin" readonly />
  </div>
</template>

<script generic="TId extends string" lang="ts" setup>
import V2vValueOrigin from '@/modules/v2v/components/mapping/V2vValueOrigin.vue'
import type { V2vResolvedTarget, V2vTargetOption } from '@/modules/v2v/types/v2v-mapping.type.ts'
import { getV2vTargetOptionLabel } from '@/modules/v2v/utils/v2v-mapping.util.ts'
import { computed } from 'vue'

const { target, options } = defineProps<{
  target: V2vResolvedTarget<TId>
  options: V2vTargetOption<TId>[]
}>()

const label = computed(() => getV2vTargetOptionLabel(options, target.value))
</script>

<style lang="postcss" scoped>
.v2v-target-value {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.8rem;
}
</style>
