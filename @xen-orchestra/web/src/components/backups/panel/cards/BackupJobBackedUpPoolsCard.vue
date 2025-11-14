<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('backed-up-pools') }}
      <UiCounter :value="backedUpPools.length" accent="neutral" size="small" variant="primary" />
    </UiCardTitle>
    <div>
      <UiCollapsibleList tag="ul" :total-items="backedUpPools.length">
        <li v-for="pool in backedUpPools" :key="pool.id">
          <UiLink size="small" icon="fa:city" :to="`/pool/${pool.id}`">
            {{ pool.name_label }}
          </UiLink>
        </li>
      </UiCollapsibleList>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { XoPool } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { backedUpPools } = defineProps<{
  backedUpPools: XoPool[]
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;
}
</style>
