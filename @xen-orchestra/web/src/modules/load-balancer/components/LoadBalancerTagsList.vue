<template>
  <UiTagsList v-if="loadBalancerTags.length > 0">
    <LoadBalancerTag v-for="tag in loadBalancerTags" :key="tag.raw" :load-balancer-tag="tag" />
  </UiTagsList>
</template>

<script lang="ts" setup>
import LoadBalancerTag from '@/modules/load-balancer/components/LoadBalancerTag.vue'
import { parseLoadBalancerTags } from '@/modules/load-balancer/utils/load-balancer-tags.ts'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { computed } from 'vue'

const { tags } = defineProps<{
  tags: string[]
}>()

const loadBalancerTags = computed(() => parseLoadBalancerTags(tags))
</script>
