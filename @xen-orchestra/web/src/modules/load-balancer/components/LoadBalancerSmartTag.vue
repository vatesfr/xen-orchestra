<template>
  <LoadBalancerTag v-if="loadBalancerTagInfo !== undefined" :load-balancer-tag="loadBalancerTagInfo" />
  <UiTag v-else accent="info" variant="secondary">
    {{ tag }}
  </UiTag>
</template>

<script lang="ts" setup>
import LoadBalancerTag from '@/modules/load-balancer/components/LoadBalancerTag.vue'
import { parseLoadBalancerTag } from '@/modules/load-balancer/utils/load-balancer-tags.ts'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { computed } from 'vue'

const { tag } = defineProps<{
  tag: string
}>()

const loadBalancerTagInfo = computed(() => parseLoadBalancerTag(tag))
</script>
