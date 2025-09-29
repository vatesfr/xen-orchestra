<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('backed-up-pools') }}
      <UiCounter :value="backedUpPoolsCount" accent="neutral" size="small" variant="primary" />
    </UiCardTitle>
    <div>
      <UiCollapsibleList tag="ul" :total-items="backedUpPoolsCount">
        <template v-for="(pool, index) in backedUpPools" :key="index">
          <li v-if="pool !== undefined">
            <UiLink size="small" icon="fa:city" :to="`/pool/${pool.id}`">
              {{ pool.name_label }}
            </UiLink>
          </li>
        </template>
      </UiCollapsibleList>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoPool } from '@/types/xo/pool.type.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backedUpPools } = defineProps<{
  backedUpPools: XoPool[]
}>()

const { t } = useI18n()

const backedUpPoolsCount = computed(() => backedUpPools.length)
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;
}
</style>
