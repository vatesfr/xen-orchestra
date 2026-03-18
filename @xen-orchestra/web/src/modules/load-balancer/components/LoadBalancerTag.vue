<template>
  <UiTag class="load-balancer-tag" :accent="tagAccent" variant="secondary" :icon="tagIcon">
    <template v-if="loadBalancerTag.type === 'ignore'">
      {{ t('load-balancer:ignore') }}
    </template>
    <template v-else>
      <span class="label">
        <span class="type">{{
          loadBalancerTag.type === 'affinity' ? t('load-balancer:affinity') : t('load-balancer:anti-affinity')
        }}</span>
        <span class="group">{{ loadBalancerTag.group }}</span>
      </span>
    </template>
  </UiTag>
</template>

<script lang="ts" setup>
import type { LoadBalancerTagInfo } from '@/modules/load-balancer/utils/load-balancer-tags.ts'
import type { IconName } from '@core/icons'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { loadBalancerTag } = defineProps<{
  loadBalancerTag: LoadBalancerTagInfo
}>()

const { t } = useI18n()

const tagAccent = computed(() => {
  switch (loadBalancerTag.type) {
    case 'affinity':
      return 'success'
    case 'anti-affinity':
      return 'danger'
    case 'ignore':
      return 'muted'
    default:
      return 'success'
  }
})

const tagIcon = computed<IconName | undefined>(() => {
  switch (loadBalancerTag.type) {
    case 'affinity':
      return 'fa:link'
    case 'anti-affinity':
      return 'fa:remove'
    case 'ignore':
      return 'fa:circle-minus'
    default:
      return undefined
  }
})
</script>

<style lang="postcss" scoped>
.load-balancer-tag {
  .label {
    display: flex;
    gap: 0.4rem;
    align-items: center;
  }

  .type {
    font-weight: 600;
  }

  .group {
    opacity: 0.8;
  }
}
</style>
